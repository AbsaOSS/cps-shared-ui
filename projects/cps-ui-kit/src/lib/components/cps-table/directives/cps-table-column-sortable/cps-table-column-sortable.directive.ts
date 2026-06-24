import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';
import { CpsSortIconComponent } from '../../components/internal/cps-sort-icon/cps-sort-icon.component';

/**
 * CpsTableColumnSortableDirective is a sorting directive used to sort single or multiple columns in table.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[cpsTColSortable]',
  host: {
    class: 'p-sortable-column',
    '(click)': 'onClick($event)'
  }
})
export class CpsTableColumnSortableDirective implements OnInit, OnDestroy {
  /**
   * Name of the column to be sorted.
   * @group Props
   */
  @Input('cpsTColSortable') field = '';

  sortIconRef: ComponentRef<CpsSortIconComponent>;
  private _sortSub: Subscription | undefined;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private dataTable: Table
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
    this._sortSub = this.dataTable.tableService.sortSource$.subscribe(() => {
      this._updateAriaSort();
    });
  }

  onClick(event: MouseEvent): void {
    if ((event.target as Element)?.closest('.cps-table-col-filter')) return;
    this.dataTable.sort({ field: this.field });
    DomHandler.clearSelection();
  }

  private _updateAriaSort(): void {
    let value: 'ascending' | 'descending' | 'none' = 'none';
    if (this.dataTable.sortMode === 'single') {
      if (this.dataTable.isSorted(this.field)) {
        value = this.dataTable.sortOrder === 1 ? 'ascending' : 'descending';
      }
    } else {
      const meta = this.dataTable.getSortMeta(this.field);
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
