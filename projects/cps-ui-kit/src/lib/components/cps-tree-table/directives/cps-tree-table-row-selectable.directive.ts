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

@Directive({
  standalone: true,
  selector: '[cpsTTRowSelectable]'
})
export class CpsTreeTableRowSelectableDirective implements OnInit, OnDestroy {
  @Input('cpsTTRowSelectable') value: any;
  checkboxCompRef: ComponentRef<TTCheckbox>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkboxCompRef = this.viewContainerRef.createComponent(TTCheckbox);
  }

  ngOnInit(): void {
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
