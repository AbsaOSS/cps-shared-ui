import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TTCheckbox } from 'primeng/treetable';

/**
 * CpsTreeTableRowSelectableDirective is a directive used to apply a checkbox to a body cell.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[cpsTTRowSelectable]'
})
export class CpsTreeTableRowSelectableDirective implements OnInit, OnDestroy {
  /**
   * Cell value.
   * @group Props
   */
  @Input('cpsTTRowSelectable') value: any;

  checkboxCompRef: ComponentRef<TTCheckbox>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkboxCompRef = this.viewContainerRef.createComponent(TTCheckbox);
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.classList.add(
      'cps-treetable-selectable-cell'
    );
    this.checkboxCompRef.setInput('value', this.value);

    this.elementRef.nativeElement.appendChild(
      this.checkboxCompRef.location.nativeElement
    );
  }

  ngOnDestroy(): void {
    this.checkboxCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
