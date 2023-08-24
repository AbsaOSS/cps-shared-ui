import {
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
import {
  TreeTable,
  TreeTableService,
  TreeTableModule
} from 'primeng/treetable';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import { find, isEqual } from 'lodash-es';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';

export function treeTableFactory(tableComponent: CpsTreeTableComponent) {
  return tableComponent.primengTreeTable;
}

export type CpsTreeTableSize = 'small' | 'normal' | 'large';
export type CpsTreeTableToolbarSize = 'small' | 'normal';
@Component({
  selector: 'cps-tree-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TreeTableModule,
    CpsInputComponent,
    CpsButtonComponent,
    CpsMenuComponent,
    CpsIconComponent
  ],
  templateUrl: './cps-tree-table.component.html',
  styleUrls: ['./cps-tree-table.component.scss'],
  providers: [
    TreeTableService,
    {
      provide: TreeTable,
      useFactory: treeTableFactory,
      // eslint-disable-next-line no-use-before-define
      deps: [CpsTreeTableComponent]
    }
  ]
})
export class CpsTreeTableComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() columns: { [key: string]: any }[] = [];
  @Input() colHeaderName = 'header';
  @Input() colFieldName = 'field';

  @Input() size: CpsTreeTableSize = 'normal';
  @Input() striped = true;
  @Input() bordered = true;

  @Input() hasToolbar = true;
  @Input() toolbarSize: CpsTreeTableToolbarSize = 'normal';
  @Input() toolbarTitle = '';

  @Input() showGlobalFilter = true;
  @Input() globalFilterPlaceholder = 'Search';
  @Input() globalFilterFields: string[] = [];

  @Input() loading = false;

  @Input() scrollable = true;
  @Input() scrollHeight = ''; // 'flex' or value+'px'

  @Input() showActionBtn = false;
  @Input() actionBtnTitle = 'Action';

  @Input() showColumnsToggle = false; // if external body template is provided, use columnsSelected event emitter

  @Output() actionBtnClicked = new EventEmitter<void>();
  @Output() columnsSelected = new EventEmitter<{ [key: string]: any }[]>();

  @ContentChild('toolbar', { static: false })
  public toolbarTemplate!: TemplateRef<any>;

  @ContentChild('header', { static: false })
  public headerTemplate!: TemplateRef<any>;

  @ContentChild('nestedHeader', { static: false })
  public nestedHeaderTemplate!: TemplateRef<any>;

  @ContentChild('body', { static: false })
  public bodyTemplate!: TemplateRef<any>;

  @ViewChild('primengTreeTable', { static: true })
  primengTreeTable!: TreeTable;

  selectedColumns: { [key: string]: any }[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // this.emptyBodyHeight = convertSize(this.emptyBodyHeight);
    // if (!this.scrollable) this.virtualScroll = false;

    // if (this.paginator) {
    //   if (this.rowsPerPageOptions.length < 1)
    //     this.rowsPerPageOptions = [5, 10, 25, 50];

    //   if (!this.rows) this.rows = this.rowsPerPageOptions[0];
    //   else {
    //     if (!this.rowsPerPageOptions.includes(this.rows)) {
    //       throw new Error('rowsPerPageOptions must include rows');
    //     }
    //   }

    //   this.rowOptions = this.rowsPerPageOptions.map((v) => ({
    //     label: '' + v,
    //     value: v
    //   }));
    // }

    if (
      this.showGlobalFilter &&
      this.globalFilterFields?.length < 1 &&
      this.data?.length > 0
    ) {
      this.globalFilterFields = Object.keys(this.data[0].data);
    }

    this.selectedColumns = this.columns;
  }

  get styleClass() {
    const classesList = [];
    switch (this.size) {
      case 'small':
        classesList.push('p-treetable-sm');
        break;
      case 'large':
        classesList.push('p-treetable-lg');
        break;
    }
    switch (this.toolbarSize) {
      case 'small':
        classesList.push('cps-tbar-small');
        break;
      case 'normal':
        classesList.push('cps-tbar-normal');
        break;
    }
    if (this.striped) {
      classesList.push('p-treetable-striped');
    }
    if (this.bordered) {
      classesList.push('p-treetable-gridlines');
    }

    if (this.scrollHeight && !this.loading && this.data.length > 0) {
      classesList.push('cps-table-bottom-bordered');
    }

    return classesList.join(' ');
  }

  onFilterGlobal(value: string) {
    this.primengTreeTable.filterGlobal(value, 'contains');
    setTimeout(() => {
      this.cdRef.markForCheck();
    }, 300);
  }

  onClickActionBtn() {
    this.actionBtnClicked.emit();
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
}
