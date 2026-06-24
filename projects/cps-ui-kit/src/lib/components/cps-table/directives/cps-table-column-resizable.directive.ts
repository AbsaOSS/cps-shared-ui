import { Directive, Input, inject } from '@angular/core';
import { ResizableColumn } from 'primeng/table';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../services/cps-root-font-size/cps-root-font-size.service';

/**
 * CpsTableColumnResizableDirective is a directive to enable column resizing in a table.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[cpsTColResizable]'
})
export class CpsTableColumnResizableDirective extends ResizableColumn {
  /**
   * Whether the column resizing should be disabled.
   * @group Props
   */
  @Input('cpsTColResizableDisabled') override pResizableColumnDisabled:
    | boolean
    | undefined;

  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);

  private get _rootFontSizePx(): number {
    return this._cpsRootFontSizeService?.fontSize() || 16;
  }

  private _keydownListener?: () => void;
  private _focusListener?: () => void;
  private _blurListener?: () => void;
  private _thScrollListener?: () => void;

  override onAfterViewInit(): void {
    super.onAfterViewInit();
    if (this.isEnabled() && this.resizer) {
      this.renderer.setAttribute(this.resizer, 'tabindex', '0');
      this.renderer.setAttribute(this.resizer, 'role', 'separator');
      this.renderer.setAttribute(this.resizer, 'aria-orientation', 'vertical');
      this.renderer.setAttribute(
        this.resizer,
        'aria-label',
        'Column resizer. Use left/right arrow keys to resize. Hold Shift for larger steps.'
      );
      this.zone.runOutsideAngular(() => {
        this._keydownListener = this.renderer.listen(
          this.resizer,
          'keydown',
          this._onResizerKeydown.bind(this)
        );
        this._focusListener = this.renderer.listen(this.resizer, 'focus', () =>
          this.renderer.addClass(this.resizer, 'cps-col-resizer-focused')
        );
        this._blurListener = this.renderer.listen(this.resizer, 'blur', () =>
          this.renderer.removeClass(this.resizer, 'cps-col-resizer-focused')
        );
        // When the resizer gets focus the browser's scroll-into-view shifts the <th>
        // content (scrollLeft > 0), making the handle appear misaligned. We use focusin
        // (which bubbles from any child) to identify exactly WHICH child triggered the
        // scroll. focusin fires before scroll-into-view runs, so we schedule a rAF:
        // the scroll completes synchronously within the same focus task, and the rAF
        // fires after the task ends (before the next paint) — no visible flash, no
        // interference with PrimeNG's drag setup. Sort/filter buttons are left alone.
        this._thScrollListener = this.renderer.listen(
          this.el.nativeElement,
          'focusin',
          (event: FocusEvent) => {
            if (event.target !== this.resizer) return;
            const th = this.el.nativeElement as HTMLElement;
            requestAnimationFrame(() => {
              if (th.scrollLeft !== 0) th.scrollLeft = 0;
            });
          }
        );
      });
    }

    // Fix for PrimeNG fit-mode resize: browsers ignore max-width on <td> in auto table
    // layout, so CSS injection only resizes header cells but not body cells. Patch
    // resizeTableCells once per table to set th.style.width directly and switch to
    // table-layout:fixed so body cells automatically inherit column widths from headers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = this.dataTable as any;
    if (!table._cpsResizeCellsPatched) {
      table._cpsResizeCellsPatched = true;
      const original = table.resizeTableCells.bind(table) as (
        newColumnWidth: number,
        nextColumnWidth: number | null
      ) => void;
      table.resizeTableCells = (
        newColumnWidth: number,
        nextColumnWidth: number | null
      ) => {
        if (table.columnResizeMode !== 'fit') {
          original(newColumnWidth, nextColumnWidth);
          return;
        }
        const tableEl = table.tableViewChild
          ?.nativeElement as HTMLElement | null;
        const thead = (table.el.nativeElement as HTMLElement).querySelector(
          '[data-pc-section="thead"]'
        ) as HTMLElement | null;
        if (!tableEl || !thead) {
          original(newColumnWidth, nextColumnWidth);
          return;
        }
        const headers = Array.from(
          thead.querySelectorAll('tr > th')
        ) as HTMLElement[];
        const resizeEl = table.resizeColumnElement as HTMLElement | null;
        if (!resizeEl) return;
        // Count previous element siblings to get 0-based column index (mirrors DomHandler.index)
        let colIndex = 0;
        let prev = resizeEl.previousElementSibling;
        while (prev) {
          colIndex++;
          prev = prev.previousElementSibling;
        }
        // Snapshot current widths before applying changes
        const widths = headers.map((h) => h.offsetWidth);
        // Apply widths directly on <th> elements
        headers.forEach((h, i) => {
          let w = widths[i];
          if (i === colIndex) w = newColumnWidth;
          else if (nextColumnWidth !== null && i === colIndex + 1)
            w = nextColumnWidth;
          h.style.width = w / this._rootFontSizePx + 'rem';
        });
        // Switch to fixed layout so body <td> cells match header widths automatically
        tableEl.style.tableLayout = 'fixed';
        // Remove any leftover CSS injection from a prior expand-mode resize
        table.destroyStyleElement?.();
      };
    }
  }

  override onDestroy(): void {
    this._keydownListener?.();
    this._focusListener?.();
    this._blurListener?.();
    this._thScrollListener?.();
    this._keydownListener = undefined;
    this._focusListener = undefined;
    this._blurListener = undefined;
    this._thScrollListener = undefined;
    super.onDestroy();
  }

  private _onResizerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const delta = direction * (event.shiftKey ? 50 : 10);
    const th = this.el.nativeElement as HTMLElement;
    const newColumnWidth = th.offsetWidth + delta;
    if (newColumnWidth < 15) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = this.dataTable as any;
    table.resizeColumnElement = th;

    if (table.columnResizeMode === 'expand') {
      const tableWidth = table.tableViewChild.nativeElement.offsetWidth + delta;
      table._initialColWidths = table._totalTableWidth();
      table.setResizeTableWidth(tableWidth / this._rootFontSizePx + 'rem');
      table.resizeTableCells(newColumnWidth, null);
    } else {
      const nextColumn = th.nextElementSibling as HTMLElement | null;
      if (!nextColumn) return;
      const nextColumnWidth = nextColumn.offsetWidth - delta;
      if (nextColumnWidth < 15) return;
      table.resizeTableCells(newColumnWidth, nextColumnWidth);
    }

    table.onColResize.emit({ element: th, delta });
  }
}
