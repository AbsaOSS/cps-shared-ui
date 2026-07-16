import { DOCUMENT } from '@angular/common';
import {
  ComponentRef,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewContainerRef,
  type SimpleChanges
} from '@angular/core';
import { TreeTableToggler } from '../../../../primeng-temp/treetable/public_api';

/**
 * CpsTreetableRowTogglerDirective is a directive used to apply a chevron toggler icon to a body cell.
 * @group Directives
 */
@Directive({
  selector: '[cpsTTRowToggler]'
})
export class CpsTreetableRowTogglerDirective
  implements OnInit, OnChanges, OnDestroy
{
  /**
   * Cell value.
   * @group Props
   */
  @Input('cpsTTRowToggler') rowNode: any;

  togglerCompRef: ComponentRef<TreeTableToggler>;

  constructor(
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: Document,
    private viewContainerRef: ViewContainerRef
  ) {
    this.togglerCompRef =
      this.viewContainerRef.createComponent(TreeTableToggler);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.rowNode && this.togglerCompRef) {
      this.togglerCompRef.setInput('rowNode', this._rowNodeWithExpanded());
    }
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.classList.add(
      'cps-treetable-row-toggler-cell'
    );
    this.togglerCompRef.setInput('rowNode', this._rowNodeWithExpanded());

    const spanElement = this.document.createElement('span');
    spanElement.style.display = 'flex';

    while (this.elementRef.nativeElement.firstChild) {
      spanElement.appendChild(this.elementRef.nativeElement.firstChild);
    }
    this.elementRef.nativeElement.appendChild(spanElement);

    spanElement.prepend(this.togglerCompRef.location.nativeElement);
  }

  private _rowNodeWithExpanded() {
    const node = this.rowNode?.node;
    return {
      ...this.rowNode,
      get expanded() {
        return !node?.expanded;
      }
    };
  }

  ngOnDestroy(): void {
    this.togglerCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
