import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { CpsMenuComponent, CpsMenuItem } from '../cps-menu/cps-menu.component';
import { CpsLoaderComponent } from '../cps-loader/cps-loader.component';
import { find, isEqual } from 'lodash-es';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

export function tableFactory(tableComponent: CpsTableComponent) {
  return tableComponent.primengTable;
}

export type CpsTableExportFormat = 'csv' | 'xlsx'; // | 'pdf';

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
    CpsLoaderComponent
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

  @Input() loading = false;

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

  @Input() showExportBtn = false;
  @Input() exportFilename = 'download';
  @Input() csvSeparator = ',';

  @Input() dataKey = ''; // field, that uniquely identifies a record in data (needed for expandable rows)

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

  @ContentChild('rowexpansion', { static: false })
  public rowExpansionTemplate!: TemplateRef<any>;

  @ViewChild('primengTable', { static: true })
  primengTable!: Table;

  styleClass = '';
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
