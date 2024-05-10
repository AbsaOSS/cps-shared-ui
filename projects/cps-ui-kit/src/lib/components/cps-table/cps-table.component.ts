import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableService, TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsMenuComponent, CpsMenuItem } from '../cps-menu/cps-menu.component';
import { CpsLoaderComponent } from '../cps-loader/cps-loader.component';
import { TableRowMenuComponent } from './components/internal/table-row-menu/table-row-menu.component';
import { CpsTableColumnSortableDirective } from './directives/cps-table-column-sortable.directive';
import { TableUnsortDirective } from './directives/internal/table-unsort.directive';
import { convertSize } from '../../utils/internal/size-utils';
import { isEqual } from 'lodash-es';
import { CpsTableColumnFilterDirective } from './directives/cps-table-column-filter.directive';
import { CpsDetectFilterTypePipe } from './pipes/cps-detect-filter-type.pipe';

// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

/**
 * CpsTableExportFormat is used to define the format of the exported file.
 * @group Types
 */
export type CpsTableExportFormat = 'csv' | 'xlsx'; // | 'pdf';

/**
 * CpsTableAppearanceType is used to define the border of the table.
 * @group Types
 */
export type CpsTableSize = 'small' | 'normal' | 'large';

/**
 * CpsTableToolbarSize is used to define the size of the toolbar.
 * @group Types
 */
export type CpsTableToolbarSize = 'small' | 'normal';

/**
 * CpsTableSortMode is used to define the sorting mode of the table.
 * @group Types
 */
export type CpsTableSortMode = 'single' | 'multiple';

/**
 * CpsTableComponent displays data in tabular format.
 * @group Components
 */
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
    CpsTableColumnSortableDirective,
    CpsTableColumnFilterDirective,
    CpsDetectFilterTypePipe
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
  /**
   * An array of objects to represent dynamic columns.
   * @group Props
   */
  @Input() columns: { [key: string]: any }[] = [];

  /**
   * A key used to retrieve the header from columns.
   * @group Props
   */
  @Input() colHeaderName = 'header';

  /**
   * A key used to retrieve the field from columns.
   * @group Props
   */
  @Input() colFieldName = 'field';

  /**
   * Determines whether the table should have alternating stripes.
   * @group Props
   */
  @Input() striped = true;

  /**
   * Determines whether the table should have borders.
   * @group Props
   */
  @Input() bordered = true;

  /**
   * Size of table cells, it can be "small", "normal" or "large".
   * @group Props
   */
  @Input() size: CpsTableSize = 'normal';

  /**
   * Determines whether the table should have row selection.
   * @group Props
   */
  @Input() selectable = false;

  /**
   * Determines whether the table should have rows highlighting on hover.
   * @group Props
   */
  @Input() rowHover = true;

  /**
   * Field, that uniquely identifies a record in data (needed for expandable rows).
   * @group Props
   */
  @Input() dataKey = '';

  /**
   * Determines whether the table should show row menus.
   * @group Props
   */
  @Input() showRowMenu = false;

  /**
   * Determines whether the 'Remove' button should be displayed in the row menu.
   * Note: This setting only takes effect if 'showRowMenu' is true.
   * @group Props
   */
  @Input() showRowRemoveButton = true;

  /**
   * Determines whether the 'Edit' button should be displayed in the row menu.
   * Note: This setting only takes effect if 'showRowMenu' is true.
   * @group Props
   */
  @Input() showRowEditButton = true;

  /**
   * Determines whether the table should have re-orderable rows.
   * @group Props
   */
  @Input() reorderableRows = false;

  /**
   * When enabled, a loader component is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Inline style of the table.
   * @group Props
   */
  @Input() tableStyle = undefined;

  /**
   * Style class of the table.
   * @group Props
   */
  @Input() tableStyleClass = '';

  /**
   * Makes all columns sortable if columns prop is provided.
   * @group Props
   */
  @Input() sortable = false;

  /**
   * Enable filtering on all columns.
   * @group Props
   */
  @Input() filterableByColumns = false;

  /**
   * If true, automatically detects filter type based on values, otherwise sets string filter type for all columns.
   * Only applied when filterableByColumns is true.
   * @group Props
   */
  @Input() autoColumnFilterType = true;

  /**
   * Determines whether sorting works on single column or on multiple columns.
   * @group Props
   */
  @Input() sortMode: CpsTableSortMode = 'single';

  /**
   * Determines whether to use the default sorting or a custom one using sortFunction.
   * @group Props
   */
  @Input() customSort = false;

  /**
   * Determines whether the table has a toolbar.
   * @group Props
   */
  @Input() hasToolbar = true;

  /**
   * Toolbar size, it can be "small" or "normal".
   * @group Props
   */
  @Input() toolbarSize: CpsTableToolbarSize = 'normal';

  /**
   * Toolbar title.
   * @group Props
   */
  @Input() toolbarTitle = '';

  /**
   * Toolbar icon name.
   * @group Props
   */
  @Input() toolbarIcon = '';

  /**
   * Toolbar icon color.
   * @group Props
   */
  @Input() toolbarIconColor = '';

  /**
   * Makes table scrollable.
   * @group Props
   */
  @Input() scrollable = true;

  /**
   * Height of the scroll viewport in fixed pixels or the "flex" keyword for a dynamic size.
   * @group Props
   */
  @Input() scrollHeight = '';

  /**
   * Determines whether only the elements within scrollable area should be added into the DOM. Works only if scrollable prop is true.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   * Determines how many additional elements to add to the DOM outside of the view.
   * @group Props
   */
  @Input() numToleratedItems = 10;

  /**
   * Determines whether the table should have paginator.
   * @group Props
   */
  @Input() paginator = false;

  /**
   * Determines whether to show paginator even if there is only one page.
   * @group Props
   */
  @Input() alwaysShowPaginator = true;

  /**
   * Array of integer values to display inside rows per page dropdown of paginator.
   * @group Props
   */
  @Input() rowsPerPageOptions: number[] = [];

  /**
   * Index of the first row to be displayed.
   * @group Props
   */
  @Input() first = 0;

  /**
   * Number of rows to display per page.
   * @group Props
   */
  @Input() rows = 0;

  /**
   * Determines whether to reset page on rows change.
   * @group Props
   */
  @Input() resetPageOnRowsChange = false;

  /**
   * Determines whether to reset page on table data sorting.
   * @group Props
   */
  @Input() resetPageOnSort = true;

  /**
   * Number of total records.
   * @group Props
   */
  @Input() totalRecords = 0;

  /**
   * Text to display when there is no data.
   * @group Props
   */
  @Input() emptyMessage = 'No data';

  /**
   * Height of table's body when there is no data, of type number denoting pixels or string.
   * @group Props
   */
  @Input() emptyBodyHeight: number | string = '';

  /**
   * Defines if data is loaded and interacted with in lazy manner.
   * @group Props
   */
  @Input() lazy = false;

  /**
   * Determines whether to call lazy loading on initialization.
   * @group Props
   */
  @Input() lazyLoadOnInit = true;

  /**
   * Determines whether to show global filter in the toolbar.
   * @group Props
   */
  @Input() showGlobalFilter = false;

  /**
   * Global filter placeholder.
   * @group Props
   */
  @Input() globalFilterPlaceholder = 'Search';

  /**
   * An array of fields to use in global filtering.
   * @group Props
   */
  @Input() globalFilterFields: string[] = [];

  /**
   * Determines whether to clear global filter on data loading.
   * @group Props
   */
  @Input() clearGlobalFilterOnLoading = false;

  /**
   * Determines whether to show remove button in the toolbar when rows are selected.
   * @group Props
   */
  @Input() showRemoveBtnOnSelect = true;

  /**
   * Determines whether removeBtnOnSelect is disabled.
   * @group Props
   */
  @Input() removeBtnOnSelectDisabled = false;

  /**
   * Determines whether to show additional button in the toolbar when rows are selected.
   * @group Props
   */
  @Input() showAdditionalBtnOnSelect = false;

  /**
   * AdditionalBtnOnSelect title.
   * @group Props
   */
  @Input() additionalBtnOnSelectTitle = 'Select action';

  /**
   * AdditionalBtnOnSelect icon.
   * @group Props
   */
  @Input() additionalBtnOnSelectIcon = '';

  /**
   * Determines whether additionalBtnOnSelect is disabled.
   * @group Props
   */
  @Input() additionalBtnOnSelectDisabled = false;

  /**
   * Determines whether to show action button in the toolbar.
   * @group Props
   */
  @Input() showActionBtn = false;

  /**
   * Action button title.
   * @group Props
   */
  @Input() actionBtnTitle = 'Action';

  /**
   * Action button icon.
   * @group Props
   */
  @Input() actionBtnIcon = '';

  /**
   * Determines whether actionBtn is disabled.
   * @group Props
   */
  @Input() actionBtnDisabled = false;

  /**
   * Determines whether to show export button in the toolbar.
   * @group Props
   */
  @Input() showExportBtn = false;

  /**
   * Determines whether exportBtn is disabled.
   * @group Props
   */
  @Input() exportBtnDisabled = false;

  /**
   * Name of the exported file.
   * @group Props
   */
  @Input() exportFilename = 'download';

  /**
   * Character to use as the csv separator.
   * @group Props
   */
  @Input() csvSeparator = ',';

  /**
   * Determines whether to show data reload button in the toolbar.
   * @group Props
   */
  @Input() showDataReloadBtn = false;

  /**
   * Determines whether dataReloadBtn is disabled.
   * @group Props
   */
  @Input() dataReloadBtnDisabled = false;

  /**
   * Determines whether the table should show columnsToggle menu, where you can choose which columns to be displayed. If external body template is provided, use columnsSelected event emitter.
   * @group Props
   */
  @Input() showColumnsToggleBtn = false;

  /**
   * Determines whether columnsToggle button is disabled.
   * @group Props
   */
  @Input() columnsToggleBtnDisabled = false;

  /**
   * Array of initial columns to show in the table. If not provided, all columns are initially visible.
   * @group Props
   */
  @Input() initialColumns: { [key: string]: any }[] = [];

  /**
   * If set to true, row data are rendered using innerHTML.
   * @group Props
   */
  @Input() renderDataAsHTML = false;

  /**
   * An array of objects to display.
   * @default []
   * @group Props
   */
  @Input() set data(value: any[]) {
    this._data = [...value];
  }

  get data(): any[] {
    return this._data;
  }

  /**
   * Callback to invoke on selection changed. Returns selected rows.
   * @param {any[]} any[] - selected rows.
   * @group Emits
   */
  @Output() rowsSelected = new EventEmitter<any[]>();

  /**
   * Callback to invoke on selection changed. Returns selected rows indexes.
   * @param {number[]} number[] - selected rows indexes.
   * @group Emits
   */
  @Output() selectedRowIndexes = new EventEmitter<number[]>();

  /**
   * Callback to invoke when action button is clicked.
   * @param {void} void - action button clicked.
   * @group Emits
   */
  @Output() actionBtnClicked = new EventEmitter<void>();

  /**
   * Callback to invoke when edit-row button is clicked.
   * @param {{row: any, index: number}} {row: any, index: number} - edit-row button clicked.
   * @group Emits
   */
  @Output() editRowBtnClicked = new EventEmitter<{ row: any; index: number }>();

  /**
   * Callback to invoke on rows removal. Returns rows.
   * @param {any[]} any[] - array of rows to remove.
   * @group Emits
   */
  @Output() rowsToRemove = new EventEmitter<any[]>();

  /**
   * Callback to invoke on rows removal. Returns rows indexes.
   * @param {number[]} number[] - array of indexes of rows to remove.
   * @group Emits
   */
  @Output() rowIndexesToRemove = new EventEmitter<number[]>();

  /**
   * Callback to invoke on page changed.
   * @param {any} any - page changed.
   * @group Emits
   */
  @Output() pageChanged = new EventEmitter<any>();

  /**
   * Callback to invoke when data is sorted.
   * @param {any} any - sort meta.
   * @group Emits
   */
  @Output() sorted = new EventEmitter<any>();

  /**
   * Callback to invoke when data is filtered.
   * @param {any} any - custom filtering event.
   * @group Emits
   */
  @Output() filtered = new EventEmitter<any>();

  /**
   * Callback to invoke when rows are reordered.
   * @param {any} any - rows reordered.
   * @group Emits
   */
  @Output() rowsReordered = new EventEmitter<any>();

  /**
   * Callback to invoke on columns selection.
   * @param {object} object - selected column.
   * @group Emits
   */
  @Output() columnsSelected = new EventEmitter<{ [key: string]: any }[]>();

  /**
   * Callback to invoke when paging, sorting or filtering happens in lazy mode.
   * @param {any} any - custom lazy loading event.
   * @group Emits
   */
  @Output() lazyLoaded = new EventEmitter<any>();

  /**
   * Callback to invoke when data-reload button is clicked.
   * @param {any} any - button clicked.
   * @group Emits
   */
  @Output() dataReloadBtnClicked = new EventEmitter<any>();

  /**
   * Callback to invoke when additional button on select is clicked.
   * @param {any[]} any[] - selected data.
   * @group Emits
   */
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

  @ViewChild('exportMenu')
  exportMenu!: CpsMenuComponent;

  @ViewChild('colToggleMenu')
  colToggleMenu!: CpsMenuComponent;

  @ViewChild('tUnsortDirective') tUnsortDirective!: TableUnsortDirective;

  _data: any[] = [];

  selectedRows: any[] = [];

  virtualScrollItemSize = 0;

  rowOptions: { label: string; value: number }[] = [];

  selectedColumns: { [key: string]: any }[] = [];

  exportMenuItems: CpsMenuItem[] = [
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
  ];

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

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

    this.selectedColumns =
      this.initialColumns.length > 0 ? this.initialColumns : this.columns;
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
    if (this.loading) {
      this.clearSelection();
      if (this.clearGlobalFilterOnLoading) this.clearGlobalFilter();
    }

    if (changes?.data) {
      this.resetSortingState();
      this.selectedRows = this.selectedRows.filter((sr) =>
        this.data.includes(sr)
      );
    }
  }

  resetSortingState() {
    this.tUnsortDirective?.resetDefaultSortOrder();
  }

  clearSelection() {
    this.selectedRows = [];
  }

  clearGlobalFilter() {
    this.globalFilterComp?.clear();
  }

  onSelectionChanged(selection: any[]) {
    this.rowsSelected.emit(selection);

    const indexes = this._getIndexes(selection);
    this.selectedRowIndexes.emit(indexes);
  }

  onSortFunction(event: SortEvent) {
    this.customSortFunction.emit(event);
  }

  onFilterGlobal(value: string) {
    this.primengTable.filterGlobal(value, 'contains');
  }

  removeSelected() {
    this.rowsToRemove.emit(this.selectedRows);

    const indexes = this._getIndexes(this.selectedRows);
    this.rowIndexesToRemove.emit(indexes);
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
    return this.primengTable.first
      ? Math.floor(this.primengTable.first / this.rows)
      : 0;
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
    return this.selectedColumns.some((item) => isEqual(item, col));
  }

  onSelectColumn(col: any) {
    let res: any[] = [];
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

  onEditRowClicked(row: any) {
    const [index] = this._getIndexes([row]);
    this.editRowBtnClicked.emit({ row, index });
  }

  onRemoveRowClicked(item: any) {
    this.rowsToRemove.emit([item]);

    const indexes = this._getIndexes([item]);
    this.rowIndexesToRemove.emit(indexes);
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
    if (this.dataReloadBtnDisabled) return;
    this.dataReloadBtnClicked.emit();
  }

  onExportData(event: any) {
    if (this.exportBtnDisabled) return;
    this.exportMenu?.toggle(event);
  }

  onColumnsToggle(event: any) {
    if (this.columnsToggleBtnDisabled) return;
    this.colToggleMenu?.toggle(event);
  }

  private _getIndexes(rows: any[]) {
    let indexes: number[] = rows.map((row) =>
      this.primengTable.value.indexOf(row)
    );

    const indexesMap = this.tUnsortDirective?.sortIndices;
    if (indexesMap && indexesMap.length > 0) {
      indexes = indexes.map((i) => indexesMap.indexOf(i));
    }

    return indexes;
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
        ...this.primengTable.value.map((item: any) =>
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

      const downloadLink = this.document.createElement('a');
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
  //     body: this.primengTable.value
  //   });
  //   doc.save(`${this.exportFilename}.pdf`);
  // }
}
