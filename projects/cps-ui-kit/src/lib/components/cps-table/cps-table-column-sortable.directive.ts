import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
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
  sortIconRef!: ComponentRef<SortIcon>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2,
    public override dt: Table
  ) {
    super(dt);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.sortIconRef = this.viewContainerRef.createComponent(SortIcon);
    this.sortIconRef.setInput('field', this.field);
    this.renderer.appendChild(
      this.elementRef.nativeElement,
      this.sortIconRef.location.nativeElement
    );
    // this.elementRef.nativeElement.appendChild(
    //   this.sortIconRef.location.nativeElement
    // );
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.sortIconRef.destroy();
    this.viewContainerRef.clear();
  }
}
