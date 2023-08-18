import {
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TableHeaderCheckbox } from 'primeng/table';

@Directive({
  standalone: true,
  selector: '[cpsHdrSelectable]'
})
export class CpsTableHeaderSelectableDirective implements OnInit, OnDestroy {
  checkboxCompRef: ComponentRef<TableHeaderCheckbox>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkboxCompRef =
      this.viewContainerRef.createComponent(TableHeaderCheckbox);
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.appendChild(
      this.checkboxCompRef.location.nativeElement
    );
  }

  ngOnDestroy(): void {
    this.checkboxCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
