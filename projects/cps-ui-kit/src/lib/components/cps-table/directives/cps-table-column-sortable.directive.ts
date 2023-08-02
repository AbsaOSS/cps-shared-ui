import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { SortIcon, SortableColumn, Table } from 'primeng/table';

@Directive({
  standalone: true,
  selector: '[cpsColSortable]'
})
export class CpsTableColumnSortableDirective
  extends SortableColumn
  implements OnInit, OnDestroy
{
  @Input('cpsColSortable') override field = '';
  sortIconRef: ComponentRef<SortIcon>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    public override dt: Table
  ) {
    super(dt);
    this.sortIconRef = this.viewContainerRef.createComponent(SortIcon);
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

  override onClick(event: MouseEvent): void {
    if (
      !this.elementRef?.nativeElement?.classList?.contains(
        'cps-table-col-filter-menu-open'
      )
    ) {
      super.onClick(event);
    }
  }
}
