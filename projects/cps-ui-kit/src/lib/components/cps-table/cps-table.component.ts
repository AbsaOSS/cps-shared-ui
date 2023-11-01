import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableService, TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsMenuComponent, CpsMenuItem } from '../cps-menu/cps-menu.component';
import { CpsLoaderComponent } from '../cps-loader/cps-loader.component';
import { TableRowMenuComponent } from './table-row-menu/table-row-menu.component';
import { CpsTableColumnSortableDirective } from './directives/cps-table-column-sortable.directive';
import { TableUnsortDirective } from './directives/internal/table-unsort.directive';
import { convertSize } from '../../utils/internal/size-utils';
import { find, isEqual } from 'lodash-es';

// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

export type CpsTableExportFormat = 'csv' | 'xlsx'; // | 'pdf';
export type CpsTableSize = 'small' | 'normal' | 'large';
export type CpsTableToolbarSize = 'small' | 'normal';
export type CpsTableSortMode = 'single' | 'multiple';

@Component({
  selector: 'cps-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    TableModule,
    TableUnsortDirective,
    CpsInputComponent,
    CpsButtonComponent,
    CpsSelectComponent,
    CpsIconComponent,
    CpsMenuComponent,
    CpsLoaderComponent,
    TableRowMenuComponent,
    CpsTableColumnSortableDirective
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
export class CpsTableComponent implements OnInit, AfterViewChecked, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: { [key: string]: any }[] = [];
  @Input() colHeaderName = 'header';
  @Input() colFieldName = 'field';

  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: CpsTableSize = 'normal';
  @Input() selectable = false;
  @Input() rowHover = true;
  @Input() dataKey = ''; // field, that uniquely identifies a record in data (needed for expandable rows)
  @Input() showRowMenu = false;
  @Input() reorderableRows = false;
  @Input() showColumnsToggle = false; // if external body template is provided, use columnsSelected event emitter
  @Input() loading = false;

  @Input() tableStyle = undefined;
  @Input() tableStyleClass = '';

  @Input() sortable = false; // makes all sortable if columns are provided
  @Input() sortMode: CpsTableSortMode = 'single';
  @Input() customSort = false;

  @Input() hasToolbar = true;
  @Input() toolbarSize: CpsTableToolbarSize = 'normal';
  @Input() toolbarTitle = '';

  @Input() scrollable = true;
  @Input() scrollHeight = ''; // 'flex' or value+'px'
  @Input() virtualScroll = false; // works only if scrollable is true
  @Input() numToleratedItems = 10;

  @Input() paginator = false;
  @Input() alwaysShowPaginator = true;
  @Input() rowsPerPageOptions: number[] = [];
  @Input() first = 0;
  @Input() rows = 0;
  @Input() resetPageOnRowsChange = false;
  @Input() resetPageOnSort = true;
  @Input() totalRecords = 0;

  @Input() emptyMessage = 'No data';
  @Input() emptyBodyHeight: number | string = '';

  @Input() lazy = false;
  @Input() lazyLoadOnInit = true;

  @Input() showGlobalFilter = false;
  @Input() globalFilterPlaceholder = 'Search';
  @Input() globalFilterFields: string[] = [];
  @Input() clearGlobalFilterOnLoading = false;

  @Input() showRemoveBtnOnSelect = true;
  @Input() removeBtnOnSelectDisabled = false;

  @Input() showAdditionalBtnOnSelect = false;
  @Input() additionalBtnOnSelectTitle = 'Select action';
  @Input() additionalBtnOnSelectDisabled = false;

  @Input() showActionBtn = false;
  @Input() actionBtnTitle = 'Action';
  @Input() actionBtnDisabled = false;

  @Input() showExportBtn = false;
  @Input() exportFilename = 'download';
  @Input() csvSeparator = ',';

  @Input() showDataReloadBtn = false;

  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() actionBtnClicked = new EventEmitter<void>();
  @Output() editRowBtnClicked = new EventEmitter<any>();
  @Output() rowsRemoved = new EventEmitter<any[]>();
  @Output() pageChanged = new EventEmitter<any>();
  @Output() sorted = new EventEmitter<any>();
  @Output() filtered = new EventEmitter<any>();
  @Output() rowsReordered = new EventEmitter<any>();
  @Output() columnsSelected = new EventEmitter<{ [key: string]: any }[]>();
  @Output() lazyLoaded = new EventEmitter<any>();
  @Output() dataReloadBtnClicked = new EventEmitter<any>();
  @Output() additionalBtnOnSelectClicked = new EventEmitter<any[]>();
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

  @ContentChild('nestedHeader', { static: false })
  public nestedHeaderTemplate!: TemplateRef<any>;

  @ContentChild('body', { static: false })
  public bodyTemplate!: TemplateRef<any>;

  @ContentChild('rowexpansion', { static: false })
  public rowExpansionTemplate!: TemplateRef<any>;

  @ViewChild('primengTable', { static: true })
  primengTable!: Table;

  @ViewChild('globalFilterComp')
  globalFilterComp!: CpsInputComponent;

  selectedRows: any[] = [];

  virtualScrollItemSize = 0;

  rowOptions: { label: string; value: number }[] = [];

  selectedColumns: { [key: string]: any }[] = [];

  exportMenuItems = [
    {
      title: 'CSV',
      icon: 'csv',
      action: () => {
        this.exportTable('csv');
      }
    },
    {
      title: 'XLSX',
      icon: 'xls',
      action: () => {
        this.exportTable('xlsx');
      }
    }
    // {
    //   title: 'PDF',
    //   icon: 'pdf',
    //   action: () => {
    //     this.exportTable('pdf');
    //   }
    // }
  ] as CpsMenuItem[];

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emptyBodyHeight = convertSize(this.emptyBodyHeight);
    if (!this.scrollable) this.virtualScroll = false;

    if (this.showAdditionalBtnOnSelect) this.showRemoveBtnOnSelect = false;

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

    this.selectedColumns = this.columns;
  }

  get styleClass() {
    const classesList = [];
    switch (this.size) {
      case 'small':
        classesList.push('p-datatable-sm');
        break;
      case 'large':
        classesList.push('p-datatable-lg');
        break;
    }
    if (this.hasToolbar) {
      switch (this.toolbarSize) {
        case 'small':
          classesList.push('cps-tbar-small');
          break;
        case 'normal':
          classesList.push('cps-tbar-normal');
          break;
      }
    }

    if (this.striped) {
      classesList.push('p-datatable-striped');
    }
    if (this.bordered) {
      classesList.push('p-datatable-gridlines');
    }

    if (this.scrollHeight && !this.loading && this.data.length > 0) {
      classesList.push('cps-table-bottom-bordered');
    }

    return classesList.join(' ');
  }

  ngAfterViewChecked() {
    if (!this.virtualScroll || this.virtualScrollItemSize) return;
    this.virtualScrollItemSize =
      this.primengTable?.el?.nativeElement
        ?.querySelector('.p-datatable-tbody')
        ?.querySelector('tr')?.clientHeight || 0;
    this.cdRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loading && this.clearGlobalFilterOnLoading)
      this.clearGlobalFilter();

    const dataChanges = changes?.data;
    if (
      dataChanges?.previousValue?.length !== dataChanges?.currentValue?.length
    ) {
      this.selectedRows = this.selectedRows.filter((sr) =>
        this.data.includes(sr)
      );
    }
  }

  clearGlobalFilter() {
    this.globalFilterComp?.clear();
  }

  onSelectionChanged(selection: any[]) {
    this.selectionChanged.emit(selection);
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

    this.rowsRemoved.emit(this.selectedRows);

    this.selectedRows = [];
  }

  onClickAdditionalBtnOnSelect() {
    this.additionalBtnOnSelectClicked.emit(this.selectedRows);
  }

  onClickActionBtn() {
    this.actionBtnClicked.emit();
  }

  onRowsPerPageChanged() {
    if (this.resetPageOnRowsChange) {
      this.primengTable.first = 0;
    }
    this.changePage(this.getPage());
  }

  getPageCount() {
    return Math.ceil(this.primengTable.totalRecords / this.rows);
  }

  getPage(): number {
    return Math.floor(this.primengTable.first / this.rows);
  }

  changePage(p: number) {
    const pc = Math.ceil(this.getPageCount());

    if (p >= 0 && p < pc) {
      this.first = this.rows * p;
      this.primengTable.onPageChange({ first: this.first, rows: this.rows });
    }
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;

    const state = {
      page: this.getPage(),
      first: this.first,
      rows: this.rows,
      pageCount: Math.ceil(this.getPageCount())
    };

    this.pageChanged.emit(state);
  }

  toggleAllColumns() {
    this.selectedColumns =
      this.selectedColumns.length < this.columns.length ? this.columns : [];
    this.columnsSelected.emit(this.selectedColumns);
  }

  isColumnSelected(col: any) {
    return !!find(this.selectedColumns, (item) => isEqual(item, col));
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
    this.columnsSelected.emit(this.selectedColumns);
  }

  onEditRowClicked(item: any) {
    this.editRowBtnClicked.emit(item);
  }

  onRemoveRowClicked(item: any) {
    this.selectedRows = this.selectedRows.filter((v: any) => v !== item);
    this.data = this.data.filter((v: any) => v !== item);
    this.rowsRemoved.emit([item]);
  }

  onSort(event: any) {
    this.sorted.emit(event);
  }

  onFilter(event: any) {
    this.filtered.emit(event);
  }

  onRowReorder(event: any) {
    this.rowsReordered.emit(event);
  }

  onLazyLoaded(event: any) {
    this.lazyLoaded.emit(event);
  }

  onReloadData() {
    this.dataReloadBtnClicked.emit();
  }

  exportTable(format: CpsTableExportFormat) {
    if (this.columns.length < 1) throw new Error('Columns must be defined!');
    if (this.selectedColumns.length < 1) throw new Error('Nothing to export!');

    switch (format) {
      case 'csv':
        this.primengTable.exportCSV();
        break;

      case 'xlsx':
        this.exportXLSX();
        break;

      // case 'pdf':
      //   this.exportPDF();
      //   break;
    }
  }

  exportXLSX() {
    import('xlsx').then((xlsx) => {
      const sheetData = [
        this.selectedColumns.map(
          (c: { [key: string]: any }) => c[this.colHeaderName]
        ),
        ...this.data.map((item: any) =>
          this.selectedColumns.map(
            (c: { [key: string]: any }) => item[c[this.colFieldName]]
          )
        )
      ];

      const worksheet = xlsx.utils.json_to_sheet(sheetData, {
        skipHeader: true
      });
      const workbook = {
        Sheets: { [this.exportFilename]: worksheet },
        SheetNames: [this.exportFilename]
      };
      const xlsxBuffer: any = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const EXCEL_TYPE =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      const blob: Blob = new Blob([xlsxBuffer], {
        type: EXCEL_TYPE
      });

      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${this.exportFilename}.xlsx`;
      downloadLink.click();
    });
  }

  // exportPDF() {
  //   const exportColumns = this.selectedColumns.map((col) => ({
  //     title: col[this.colHeaderName],
  //     dataKey: col[this.colFieldName]
  //   }));
  //   // eslint-disable-next-line new-cap
  //   const doc = new jsPDF({
  //     orientation: this.selectedColumns.length > 3 ? 'l' : 'p',
  //     unit: 'px',
  //     format: 'a4'
  //   });
  //   (doc as any).autoTable({
  //     headStyles: { fillColor: '#870a3c' },
  //     columns: exportColumns,
  //     body: this.data
  //   });
  //   doc.save(`${this.exportFilename}.pdf`);
  // }
}
