import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { DomHandler } from '../../../../primeng-temp/dom/public_api';
import { TreeTable } from '../../../../primeng-temp/treetable/public_api';
import { Subscription } from 'rxjs';
import { CpsSortIconComponent } from '../../../cps-table/components/internal/cps-sort-icon/cps-sort-icon.component';

/**
 * CpsTreeTableColumnSortableDirective is a sorting directive used to sort single or multiple columns in treetable.
 * @group Directives
 */
@Directive({
  selector: '[cpsTTColSortable]',
  host: {
    class: 'p-sortable-column',
    '(click)': 'onClick($event)'
  }
})
export class CpsTreeTableColumnSortableDirective implements OnInit, OnDestroy {
  /**
   * Name of the column to be sorted.
   * @group Props
   */
  @Input('cpsTTColSortable') field = '';

  sortIconRef: ComponentRef<CpsSortIconComponent>;
  private _sortSub: Subscription | undefined;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private tt: TreeTable
  ) {
    this.sortIconRef =
      this.viewContainerRef.createComponent(CpsSortIconComponent);
  }

  ngOnInit(): void {
    this.sortIconRef.setInput('field', this.field);
    this.elementRef.nativeElement.appendChild(
      this.sortIconRef.location.nativeElement
    );
    this._updateAriaSort();
    this._sortSub = this.tt.tableService.sortSource$.subscribe(() => {
      this._updateAriaSort();
    });
  }

  onClick(event: MouseEvent): void {
    if ((event.target as Element)?.closest('.cps-table-col-filter')) return;
    this.tt.sort({ field: this.field });
    DomHandler.clearSelection();
  }

  private _updateAriaSort(): void {
    let value: 'ascending' | 'descending' | 'none' = 'none';
    if (this.tt.sortMode === 'single') {
      if (this.tt.isSorted(this.field)) {
        value = this.tt.sortOrder === 1 ? 'ascending' : 'descending';
      }
    } else {
      const meta = this.tt.getSortMeta(this.field);
      if (meta) value = meta.order === 1 ? 'ascending' : 'descending';
    }
    this.elementRef.nativeElement.setAttribute('aria-sort', value);
  }

  ngOnDestroy(): void {
    this._sortSub?.unsubscribe();
    this.sortIconRef.destroy();
    this.viewContainerRef.clear();
  }
}
