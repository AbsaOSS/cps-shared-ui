import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { SortableColumn, Table } from 'primeng/table';
import { CpsSortIconComponent } from '../components/internal/cps-sort-icon/cps-sort-icon.component';

/**
 * CpsTableColumnSortableDirective is a sorting directive used to sort single or multiple columns in table.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[cpsTColSortable]'
})
export class CpsTableColumnSortableDirective
  extends SortableColumn
  implements OnInit, OnDestroy
{
  /**
   * Name of the column to be sorted.
   * @group Props
   */
  @Input('cpsTColSortable') override field = '';

  sortIconRef: ComponentRef<CpsSortIconComponent>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    public override dt: Table
  ) {
    super(dt);
    this.sortIconRef =
      this.viewContainerRef.createComponent(CpsSortIconComponent);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.sortIconRef.setInput('field', this.field);
    this.elementRef.nativeElement.appendChild(
      this.sortIconRef.location.nativeElement
    );
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.sortIconRef.destroy();
    this.viewContainerRef.clear();
  }
}
