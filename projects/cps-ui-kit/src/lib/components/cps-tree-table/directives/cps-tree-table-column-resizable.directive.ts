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
}
