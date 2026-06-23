import { Directive, Input } from '@angular/core';
import { TTResizableColumn } from 'primeng/treetable';

/**
 * CpsTreeTableColumnResizableDirective is a directive to enable column resizing in a treetable.
 * @group Directives
 */
@Directive({
  standalone: true,
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

  private _keydownListener?: () => void;
  private _focusListener?: () => void;
  private _blurListener?: () => void;

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
      });
    }
  }

  override onDestroy(): void {
    this._keydownListener?.();
    this._focusListener?.();
    this._blurListener?.();
    this._keydownListener = undefined;
    this._focusListener = undefined;
    this._blurListener = undefined;
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
    const tt = this.tt as any;

    if (tt.columnResizeMode === 'expand') {
      const tableEl = tt.tableViewChild?.nativeElement as HTMLElement | null;
      if (tableEl) {
        tableEl.style.width = tableEl.offsetWidth + delta + 'px';
        tableEl.style.minWidth = tableEl.style.width;
      }
      th.style.width = newColumnWidth + 'px';
    } else {
      const nextColumn = th.nextElementSibling as HTMLElement | null;
      if (!nextColumn) return;
      const nextColumnWidth = nextColumn.offsetWidth - delta;
      if (nextColumnWidth < 15) return;
      th.style.width = newColumnWidth + 'px';
      nextColumn.style.width = nextColumnWidth + 'px';
    }

    tt.onColResize.emit({ element: th, delta });
  }
}
