import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TTSortIcon, TTSortableColumn, TreeTable } from 'primeng/treetable';

@Directive({
  standalone: true,
  selector: '[cpsTTColSortable]'
})
export class CpsTreeTableColumnSortableDirective
  extends TTSortableColumn
  implements OnInit, OnDestroy
{
  @Input('cpsTTColSortable') override field = '';
  sortIconRef: ComponentRef<TTSortIcon>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    public override tt: TreeTable
  ) {
    super(tt);
    this.sortIconRef = this.viewContainerRef.createComponent(TTSortIcon);
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
        'cps-treetable-col-filter-menu-open'
      )
    ) {
      super.onClick(event);
    }
  }
}
