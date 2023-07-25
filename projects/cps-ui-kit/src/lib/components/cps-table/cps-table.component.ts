import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableService, TableModule } from 'primeng/table';
import { TableUnsortDirective } from './table-unsort.directive';
import { SortEvent } from 'primeng/api';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import { find, isEqual } from 'lodash-es';

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

@Component({
  selector: 'cps-table',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    TableModule,
    TableUnsortDirective,
    CpsInputComponent,
    CpsButtonComponent,
    CpsSelectComponent,
    CpsIconComponent,
    CpsMenuComponent
  ],
  templateUrl: './cps-table.component.html',
  styleUrls: ['./cps-table.component.scss'],
  providers: [
    TableService,
    {
      provide: Table,
      useFactory: tableFactory,
      // eslint-disable-next-line no-use-before-define
      deps: [CpsTableComponent]
    }
  ]
})
export class CpsTableComponent implements OnInit, AfterViewInit {
  @Input() headers: string[] = [];
  @Input() data: any[] = [];

  @Input() columns: { [key: string]: any }[] = [];
  @Input() colHeaderName = 'header';
  @Input() colFieldName = 'field';

  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() selectable = false;
  @Input() emptyMessage = 'No data';
  @Input() hasToolbar = true;
  @Input() toolbarSize: 'small' | 'normal' = 'normal';
  @Input() toolbarTitle = '';
  @Input() sortMode: 'single' | 'multiple' = 'multiple';
  @Input() customSort = false;
  @Input() rowHover = true;
  @Input() scrollable = true;
  @Input() scrollHeight = '';
  @Input() virtualScroll = false; // works only if scrollable is true

  @Input() paginator = false;
  @Input() alwaysShowPaginator = true;
  @Input() rowsPerPageOptions: number[] = [];
  @Input() first = 0;
  @Input() rows = 0;
  @Input() totalRecords = 0;

  @Input() lazy = false;
  @Input() lazyLoadOnInit = true;

  @Input() showGlobalFilter = false;
  @Input() globalFilterPlaceholder = 'Search';
  @Input() globalFilterFields: string[] = [];

  @Input() showRemoveBtnOnSelect = true;
  @Input() showActionBtn = false;
  @Input() actionBtnTitle = 'Action';

  @Input() reorderableRows = false;

  @Input() showColumnsToggle = false;
  // @Input() export = false; TODO
  /* @Input() */ resizableColumns = false; // TODO
  /* @Input() */ reorderableColumns = false; // TODO
  // TODO CpsTableColumnFilterDirective (type date, text, boolean, range, categories, numeric)

  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() actionBtnClicked = new EventEmitter<void>();
  @Output() pageChanged = new EventEmitter<any>();

  /**
   * A function to implement custom sorting. customSort must be true.
   * @param {any} any - sort meta.
   * @group Emits
   */
  @Output() customSortFunction: EventEmitter<any> = new EventEmitter<any>();

  @ContentChild('toolbar', { static: false })
  public toolbarTemplate!: TemplateRef<any>;

  @ContentChild('header', { static: false })
  public headerTemplate!: TemplateRef<any>;

  @ContentChild('body', { static: false })
  public bodyTemplate!: TemplateRef<any>;

  @ViewChild('primengTable', { static: true })
  primengTable!: Table;

  styleClass = '';
  selectedRows: any[] = [];

  virtualScrollItemSize = 0;

  rowOptions: { label: string; value: number }[] = [];

  selectedColumns: { [key: string]: any }[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.scrollable) this.virtualScroll = false;

    if (this.paginator) {
      if (this.rowsPerPageOptions.length < 1)
        this.rowsPerPageOptions = [5, 10, 25, 50];

      if (!this.rows) this.rows = this.rowsPerPageOptions[0];
      else {
        if (!this.rowsPerPageOptions.includes(this.rows)) {
          throw new Error('rowsPerPageOptions must include rows');
        }
      }

      this.rowOptions = this.rowsPerPageOptions.map((v) => ({
        label: '' + v,
        value: v
      }));
    }

    if (
      this.showGlobalFilter &&
      this.globalFilterFields?.length < 1 &&
      this.data?.length > 0
    ) {
      this.globalFilterFields = Object.keys(this.data[0]);
    }
    switch (this.size) {
      case 'small':
        this.styleClass = 'p-datatable-sm';
        break;
      case 'large':
        this.styleClass = 'p-datatable-lg';
        break;
    }
    switch (this.toolbarSize) {
      case 'small':
        this.styleClass += ' cps-tbar-small';
        break;
      case 'normal':
        this.styleClass += ' cps-tbar-normal';
        break;
    }
    if (this.striped) {
      this.styleClass += ' p-datatable-striped';
    }
    if (this.bordered) {
      this.styleClass += ' p-datatable-gridlines';
    }

    this.selectedColumns = this.columns;
  }

  ngAfterViewInit() {
    this.virtualScrollItemSize =
      this.primengTable?.el?.nativeElement
        ?.querySelector('.p-datatable-tbody')
        ?.querySelector('tr')?.clientHeight || 0;
    this.cdRef.detectChanges();
  }

  onSelectionChanged(selection: any[]) {
    this.selectionChanged.emit(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      selection.map(({ _defaultSortOrder, ...rest }) => rest)
    );
  }

  onSortFunction(event: SortEvent) {
    this.customSortFunction.emit(event);
  }

  onFilterGlobal(value: string) {
    this.primengTable.filterGlobal(value, 'contains');
  }

  removeSelected() {
    const indexes: number[] = this.primengTable.selection.map(
      (s: any) => s._defaultSortOrder
    );
    indexes.sort((a, b) => b - a);

    this.data = this.data.filter(
      (v: any) => !indexes.includes(v._defaultSortOrder)
    );

    this.selectedRows = [];
  }

  onClickActionBtn() {
    this.actionBtnClicked.emit();
  }

  onRowsPerPageChanged() {
    this.first = 0;
    this.primengTable.first = this.first;
  }

  onPageChange(event: any) {
    this.pageChanged.emit(event);
  }

  toggleAllColumns() {
    this.selectedColumns =
      this.selectedColumns.length < this.columns.length ? this.columns : [];
  }

  isColumnSelected(col: any) {
    return this.selectedColumns
      ? !!find(this.selectedColumns, (item) => isEqual(item, col))
      : false;
  }

  onSelectColumn(col: any) {
    let res = [] as any;
    if (this.isColumnSelected(col)) {
      res = this.selectedColumns.filter((v: any) => !isEqual(v, col));
    } else {
      this.columns.forEach((o) => {
        if (
          this.selectedColumns.some((v: any) => isEqual(v, o)) ||
          isEqual(col, o)
        ) {
          res.push(o);
        }
      });
    }
    this.selectedColumns = res;
  }
}
