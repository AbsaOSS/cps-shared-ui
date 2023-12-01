import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TTSortableColumn, TreeTable } from 'primeng/treetable';
import { CpsSortIconComponent } from '../../cps-table/components/internal/cps-sort-icon/cps-sort-icon.component';

@Directive({
  standalone: true,
  selector: '[cpsTTColSortable]'
})
export class CpsTreeTableColumnSortableDirective
  extends TTSortableColumn
  implements OnInit, OnDestroy
{
  @Input('cpsTTColSortable') override field = '';
  sortIconRef: ComponentRef<CpsSortIconComponent>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    public override tt: TreeTable
  ) {
    super(tt);
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
