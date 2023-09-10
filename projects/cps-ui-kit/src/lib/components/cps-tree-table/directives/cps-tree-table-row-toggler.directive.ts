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
    this.togglerCompRef.setInput('rowNode', this.rowNode);

    this.elementRef.nativeElement.prepend(
      this.togglerCompRef.location.nativeElement
    );
  }

  ngOnDestroy(): void {
    this.togglerCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
