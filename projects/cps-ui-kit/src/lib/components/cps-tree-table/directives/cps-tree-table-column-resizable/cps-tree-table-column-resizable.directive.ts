import { Directive, Input, inject } from '@angular/core';
import { TTResizableColumn } from 'primeng/treetable';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../services/cps-root-font-size/cps-root-font-size.service';

/**
 * CpsTreeTableColumnResizableDirective is a directive to enable column resizing in a treetable.
 * @group Directives
 */
@Directive({
  selector: '[cpsTTColResizable]'
})
export class CpsTreeTableColumnResizableDirective extends TTResizableColumn {
  /**
   * Whether the column resizing should be disabled.
   * @group Props
   */
  @Input('cpsTTColResizableDisabled') override ttResizableColumnDisabled:
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

    const tt = this.tt as typeof this.tt & {
      _cpsResizeColGroupPatched?: boolean;
      _cpsResizeIndicatorPatched?: boolean;
      _cpsResizeBeginPatched?: boolean;
    };
    if (!tt._cpsResizeColGroupPatched) {
      tt._cpsResizeColGroupPatched = true;
      tt.resizeColGroup = (
        table: HTMLElement,
        resizeColumnIndex: number,
        newColumnWidth: number,
        nextColumnWidth: number | null
      ) => {
        if (!table || resizeColumnIndex == null || newColumnWidth == null)
          return;
        const colGroup =
          table.children[0]?.nodeName === 'COLGROUP' ? table.children[0] : null;
        if (!colGroup) return;
        const cols = Array.from(colGroup.children) as HTMLElement[];
        const col = cols[resizeColumnIndex] ?? null;
        const nextCol = col?.nextElementSibling as HTMLElement | null;
        if (col) col.style.width = newColumnWidth + 'px';
        if (nextCol && nextColumnWidth != null)
          nextCol.style.width = nextColumnWidth + 'px';
        table.style.tableLayout = 'fixed';
      };
    }

    if (!tt._cpsResizeIndicatorPatched) {
      tt._cpsResizeIndicatorPatched = true;
      const originalColumnResize = tt.onColumnResize.bind(tt);
      tt.onColumnResize = (event: MouseEvent) => {
        originalColumnResize(event);
        const indicator = tt.resizeHelperViewChild
          ?.nativeElement as HTMLElement | null;
        if (!indicator) return;
        const positionedAncestor = indicator.offsetParent as HTMLElement | null;
        if (!positionedAncestor) return;
        const hostEl = tt.el?.nativeElement as HTMLElement | null;
        const tableEl =
          (tt.tableViewChild?.nativeElement as HTMLElement | null) ??
          (hostEl?.querySelector(
            '.p-treetable-scrollable-wrapper'
          ) as HTMLElement | null);
        if (!tableEl) return;
        const tableRect = tableEl.getBoundingClientRect();
        const ancestorRect = positionedAncestor.getBoundingClientRect();
        indicator.style.top =
          Math.max(0, tableRect.top - ancestorRect.top) + 'px';
        indicator.style.height = tableEl.offsetHeight + 'px';
      };
    }

    if (!tt._cpsResizeBeginPatched) {
      tt._cpsResizeBeginPatched = true;
      const originalResizeBegin = tt.onColumnResizeBegin.bind(tt);
      tt.onColumnResizeBegin = (event: MouseEvent) => {
        originalResizeBegin(event);
        tt.onColumnResize(event);
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
    const delta = Math.round(
      direction * (event.shiftKey ? 3.125 : 0.625) * this._rootFontSizePx
    );
    const th = this.el.nativeElement as HTMLElement;
    const newColumnWidth = th.offsetWidth + delta;
    if (newColumnWidth < 15) return;

    if (this.tt.columnResizeMode === 'expand') {
      this._resizeExpand(th, newColumnWidth, delta);
    } else {
      const nextColumn = th.nextElementSibling as HTMLElement | null;
      if (!nextColumn) return;
      const nextColumnWidth = nextColumn.offsetWidth - delta;
      if (nextColumnWidth < 15) return;
      this._resizeFit(th, newColumnWidth, nextColumn, nextColumnWidth);
    }

    this.tt.onColResize.emit({ element: th, delta });
  }

  private _resizeFit(
    th: HTMLElement,
    newColumnWidth: number,
    nextColumn: HTMLElement,
    nextColumnWidth: number
  ): void {
    if (this.tt.scrollable) {
      const scrollableView = this.tt.findParentScrollableView(th);
      if (!scrollableView) return;
      const colIndex = Array.from(th.parentElement!.children).indexOf(th);
      this.tt.resizeColGroup(
        scrollableView.querySelector(
          '[data-pc-section="scrollableheadertable"]'
        ),
        colIndex,
        newColumnWidth,
        nextColumnWidth
      );
      this.tt.resizeColGroup(
        scrollableView.querySelector(
          '[data-pc-section="scrollablebody"] table'
        ) ||
          scrollableView.querySelector(
            '[data-pc-name="virtualscroller"] table'
          ),
        colIndex,
        newColumnWidth,
        nextColumnWidth
      );
      this.tt.resizeColGroup(
        scrollableView.querySelector(
          '[data-pc-section="scrollablefootertable"]'
        ),
        colIndex,
        newColumnWidth,
        nextColumnWidth
      );
    } else {
      const tableEl = this.tt.tableViewChild
        ?.nativeElement as HTMLElement | null;
      if (tableEl) {
        const ths = Array.from(
          tableEl.querySelectorAll('thead > tr:first-child > th')
        ) as HTMLElement[];
        const thWidths = ths.map((h) => h.offsetWidth);
        ths.forEach((h, i) => {
          if (!h.style.width) h.style.width = thWidths[i] + 'px';
        });
        tableEl.style.tableLayout = 'fixed';
      }
      th.style.width = newColumnWidth + 'px';
      nextColumn.style.width = nextColumnWidth + 'px';
    }
  }

  private _resizeExpand(
    th: HTMLElement,
    newColumnWidth: number,
    delta: number
  ): void {
    if (this.tt.scrollable) {
      const scrollableView = this.tt.findParentScrollableView(th);
      if (!scrollableView) return;
      const headerTable = scrollableView.querySelector(
        '[data-pc-section="scrollableheadertable"]'
      ) as HTMLElement | null;
      const bodyTable = (scrollableView.querySelector(
        '[data-pc-section="scrollablebody"] table'
      ) ||
        scrollableView.querySelector(
          '[data-pc-name="virtualscroller"] table'
        )) as HTMLElement | null;
      const footerTable = scrollableView.querySelector(
        '[data-pc-section="scrollablefootertable"]'
      ) as HTMLElement | null;
      if (headerTable) {
        headerTable.style.width = headerTable.offsetWidth + delta + 'px';
      }
      if (bodyTable) {
        bodyTable.style.width = bodyTable.offsetWidth + delta + 'px';
      }
      if (footerTable) {
        footerTable.style.width = footerTable.offsetWidth + delta + 'px';
      }
      const colIndex = Array.from(th.parentElement!.children).indexOf(th);
      this.tt.resizeColGroup(headerTable, colIndex, newColumnWidth, null);
      this.tt.resizeColGroup(bodyTable, colIndex, newColumnWidth, null);
      this.tt.resizeColGroup(footerTable, colIndex, newColumnWidth, null);
    } else {
      const tableEl = this.tt.tableViewChild
        ?.nativeElement as HTMLElement | null;
      if (tableEl) {
        const ths = Array.from(
          tableEl.querySelectorAll('thead > tr:first-child > th')
        ) as HTMLElement[];
        const thWidths = ths.map((h) => h.offsetWidth);
        const tableWidth = tableEl.offsetWidth;
        ths.forEach((h, i) => {
          if (!h.style.width) h.style.width = thWidths[i] + 'px';
        });
        tableEl.style.width = tableWidth + delta + 'px';
        tableEl.style.tableLayout = 'fixed';
      }
      th.style.width = newColumnWidth + 'px';
    }
  }
}
