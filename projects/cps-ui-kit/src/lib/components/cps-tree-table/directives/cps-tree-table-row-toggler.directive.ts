import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TreeTableToggler } from 'primeng/treetable';

@Directive({
  standalone: true,
  selector: '[cpsTTRowToggler]'
})
export class CpsTreetableRowTogglerDirective implements OnInit, OnDestroy {
  @Input('cpsTTRowToggler') rowNode: any;
  togglerCompRef: ComponentRef<TreeTableToggler>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.togglerCompRef =
      this.viewContainerRef.createComponent(TreeTableToggler);
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.classList.add(
      'cps-treetable-row-toggler-cell'
    );
    this.togglerCompRef.setInput('rowNode', this.rowNode);

    const spanElement = document.createElement('span');
    spanElement.style.display = 'flex';

    while (this.elementRef.nativeElement.firstChild) {
      spanElement.appendChild(this.elementRef.nativeElement.firstChild);
    }
    this.elementRef.nativeElement.appendChild(spanElement);

    spanElement.prepend(this.togglerCompRef.location.nativeElement);
  }

  ngOnDestroy(): void {
    this.togglerCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
