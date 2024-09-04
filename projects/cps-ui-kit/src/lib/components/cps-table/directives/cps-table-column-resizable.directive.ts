import { Directive, Input } from '@angular/core';
import { ResizableColumn } from 'primeng/table';

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
}
