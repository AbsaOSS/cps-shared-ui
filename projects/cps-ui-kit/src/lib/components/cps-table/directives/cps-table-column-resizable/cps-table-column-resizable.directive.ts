import { Directive, Input, inject } from '@angular/core';
import { ResizableColumn } from 'primeng/table';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../services/cps-root-font-size/cps-root-font-size.service';

/**
 * CpsTableColumnResizableDirective is a directive to enable column resizing in a table.
 * @group Directives
 */
@Directive({
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
      this.renderer.setAttribute(this.resizer, 'aria-label', 'Column resizer');
      this.renderer.setAttribute(this.resizer, 'aria-valuenow', '0');
      this.renderer.setAttribute(
        this.resizer,
        'aria-valuetext',
        'Use left or right arrow keys to resize the column. Hold Shift for larger steps.'
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
        const colIndex = headers.indexOf(resizeEl);
        if (colIndex === -1) return;
        const widths = headers.map((h) => h.offsetWidth);
        headers.forEach((h, i) => {
          let w = widths[i];
          if (i === colIndex) w = newColumnWidth;
          else if (nextColumnWidth !== null && i === colIndex + 1)
            w = nextColumnWidth;
          h.style.width = w / this._rootFontSizePx + 'rem';
        });
        tableEl.style.tableLayout = 'fixed';
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
