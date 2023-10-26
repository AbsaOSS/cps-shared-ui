import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TreeTable,
  TreeTableService,
  TreeTableModule
} from 'primeng/treetable';
import { DomHandler } from 'primeng/dom';
import { AngleDoubleLeftIcon } from 'primeng/icons/angledoubleleft';
import { AngleLeftIcon } from 'primeng/icons/angleleft';
import { AngleRightIcon } from 'primeng/icons/angleright';
import { AngleDoubleRightIcon } from 'primeng/icons/angledoubleright';
import { SortEvent } from 'primeng/api';
import { find, isEqual } from 'lodash-es';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { CpsLoaderComponent } from '../cps-loader/cps-loader.component';
import { CpsTreeTableColumnSortableDirective } from './directives/cps-tree-table-column-sortable.directive';
import { TreeTableUnsortDirective } from './directives/internal/tree-table-unsort.directive';
import { TableRowMenuComponent } from '../cps-table/table-row-menu/table-row-menu.component';
import { convertSize } from '../../utils/internal/size-utils';

export function treeTableFactory(tableComponent: CpsTreeTableComponent) {
  return tableComponent.primengTreeTable;
}

export type CpsTreeTableSize = 'small' | 'normal' | 'large';
export type CpsTreeTableToolbarSize = 'small' | 'normal';
export type CpsTreeTableSortMode = 'single' | 'multiple';
@Component({
  selector: 'cps-tree-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    TreeTableModule,
    CpsInputComponent,
    CpsButtonComponent,
    CpsMenuComponent,
    CpsIconComponent,
    CpsSelectComponent,
    CpsLoaderComponent,
    AngleDoubleLeftIcon,
    AngleLeftIcon,
    AngleRightIcon,
    AngleDoubleRightIcon,
    CpsTreeTableColumnSortableDirective,
    TreeTableUnsortDirective,
    TableRowMenuComponent
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
export class CpsTreeTableComponent
  implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked, OnChanges
{
  @Input() data: any[] = [];
  @Input() columns: { [key: string]: any }[] = [];
  @Input() colHeaderName = 'header';
  @Input() colFieldName = 'field';

  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: CpsTreeTableSize = 'normal';
  @Input() selectable = false;
  @Input() rowHover = true;
  @Input() showRowMenu = false;
  @Input() showColumnsToggle = false; // if external body template is provided, use columnsSelected event emitter
  @Input() loading = false;

  @Input() tableStyle = undefined;
  @Input() tableStyleClass = '';

  @Input() sortable = false; // makes all sortable if columns are provided
  @Input() sortMode: CpsTreeTableSortMode = 'single';
  @Input() customSort = false;

  @Input() hasToolbar = true;
  @Input() toolbarSize: CpsTreeTableToolbarSize = 'normal';
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

  @Input() showDataReloadBtn = false;

  @Output() selectionChanged = new EventEmitter<any[]>();
  @Output() actionBtnClicked = new EventEmitter<void>();
  @Output() additionalBtnOnSelectClicked = new EventEmitter<any[]>();
  @Output() editRowBtnClicked = new EventEmitter<any>();
  @Output() rowsRemoved = new EventEmitter<any[]>();
  @Output() pageChanged = new EventEmitter<any>();
  @Output() sorted = new EventEmitter<any>();
  @Output() filtered = new EventEmitter<any>();
  @Output() columnsSelected = new EventEmitter<{ [key: string]: any }[]>();
  @Output() lazyLoaded = new EventEmitter<any>();
  @Output() dataReloadBtnClicked = new EventEmitter<any>();
  @Output() nodeExpanded = new EventEmitter<any>();
  @Output() nodeCollapsed = new EventEmitter<any>();
  @Output() nodeSelected = new EventEmitter<any>();
  @Output() nodeUnselected = new EventEmitter<any>();

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

  @ViewChild('primengTreeTable', { static: true })
  primengTreeTable!: TreeTable;

  @ViewChild('globalFilterComp')
  globalFilterComp!: CpsInputComponent;

  selectedColumns: { [key: string]: any }[] = [];

  rowOptions: { label: string; value: number }[] = [];

  selectedRows: any[] = [];

  virtualScrollItemSize = 0;
  defScrollHeightPx = 0;
  defScrollHeight = '';

  resizeObserver: ResizeObserver;
  headerBox: any;
  scrollableBody: any;
  scrollbarWidth = 0;

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const body = entry.target;
        const sbarVisible = body.scrollHeight > body.clientHeight;

        let wScroll = sbarVisible ? this.scrollbarWidth : 0;
        if (wScroll > 0) wScroll -= 1;

        this.headerBox.style.paddingRight = `${wScroll}px`;
        this.headerBox.style.borderRight =
          wScroll > 0 ? '1px solid #d7d5d5' : 'unset';
      });
    });
  }

  ngOnInit(): void {
    this.emptyBodyHeight = convertSize(this.emptyBodyHeight);
    if (!this.scrollable) this.virtualScroll = false;

    if (this.showAdditionalBtnOnSelect) this.showRemoveBtnOnSelect = false;

    if (this.virtualScroll) {
      this.defScrollHeight = this.scrollHeight;

      if (this.defScrollHeight === 'flex')
        window.addEventListener('resize', this._onWindowResize.bind(this));

      if (this.defScrollHeight && this.defScrollHeight !== 'flex') {
        this.defScrollHeightPx = parseInt(this.scrollHeight, 10);
      }
    }

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
      this.globalFilterFields = Object.keys(this.data[0].data);
    }

    this.selectedColumns = this.columns;
  }

  ngAfterViewInit(): void {
    this.scrollableBody = this.primengTreeTable.el.nativeElement.querySelector(
      '.p-treetable-scrollable-body'
    );
    if (this.scrollableBody) {
      this.headerBox = this.primengTreeTable.el.nativeElement.querySelector(
        '.p-treetable-scrollable-header-box'
      );
      if (this.virtualScroll && this.defScrollHeight === 'flex')
        this.defScrollHeightPx = this.scrollableBody.clientHeight;

      if (this.headerBox) {
        this.scrollbarWidth = DomHandler.calculateScrollbarWidth();
        this.resizeObserver.observe(this.scrollableBody);
      }
    }
  }

  ngAfterViewChecked() {
    if (!this.virtualScroll || this.virtualScrollItemSize) return;
    this.virtualScrollItemSize =
      this.primengTreeTable?.el?.nativeElement
        ?.querySelector('.p-treetable-tbody')
        ?.querySelector('tr')?.clientHeight || 0;
    this.cdRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loading && this.clearGlobalFilterOnLoading)
      this.clearGlobalFilter();

    const dataChanges = changes?.data;
    if (dataChanges?.previousValue !== dataChanges?.currentValue) {
      this.selectedRows = [];
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.virtualScroll && this.defScrollHeight === 'flex')
      window.removeEventListener('resize', this._onWindowResize.bind(this));
  }

  clearGlobalFilter() {
    this.globalFilterComp?.clear();
  }

  private _onWindowResize() {
    this.defScrollHeightPx = this.scrollableBody.clientHeight;
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
      classesList.push('p-treetable-striped');
    }
    if (this.bordered) {
      classesList.push('p-treetable-gridlines');
    }

    if (this.scrollHeight && !this.loading && this.data.length > 0) {
      classesList.push('cps-treetable-bottom-bordered');
    }

    return classesList.join(' ');
  }

  onSortFunction(event: SortEvent) {
    this.customSortFunction.emit(event);
  }

  private _recalcVirtualHeight() {
    if (this.virtualScroll && this.defScrollHeight) {
      const itemsLen = this.primengTreeTable.serializedValue.length;
      if (itemsLen < 1) {
        this.scrollHeight = this.emptyBodyHeight
          ? (`calc(${this.emptyBodyHeight} + 1px)` as string)
          : this.virtualScrollItemSize + 1 + 'px';
      } else {
        const curHeight = this.virtualScrollItemSize * itemsLen + 2;
        if (this.defScrollHeight === 'flex') {
          if (curHeight >= this.defScrollHeightPx) {
            this.scrollHeight = 'flex';
            setTimeout(() => {
              this.scrollableBody.style.height = '100%';
              this.cdRef.markForCheck();
            });
            return;
          }
        }
        this.scrollHeight = Math.min(this.defScrollHeightPx, curHeight) + 'px';
      }
    }
  }

  onFilterGlobal(value: string) {
    this.primengTreeTable.filterGlobal(value, 'contains');
  }

  onClickAdditionalBtnOnSelect() {
    this.additionalBtnOnSelectClicked.emit(this.selectedRows);
  }

  onClickActionBtn() {
    this.actionBtnClicked.emit();
  }

  onReloadData() {
    this.dataReloadBtnClicked.emit();
  }

  removeSelected() {
    this.selectedRows.forEach((row) => this._removeNodeFromData(row, false));
    this.data = [...this.data];
    this.rowsRemoved.emit(this.selectedRows);
    this.selectedRows = [];
    setTimeout(() => {
      this._recalcVirtualHeight();
      this.cdRef.markForCheck();
    });
  }

  onEditRowClicked(node: any) {
    this.editRowBtnClicked.emit(node);
  }

  onRemoveRowClicked(node: any) {
    this.selectedRows = this.selectedRows.filter((v: any) => v !== node);
    this._removeNodeFromData(node);
    this.rowsRemoved.emit([node]);
    setTimeout(() => {
      this._recalcVirtualHeight();
      this.cdRef.markForCheck();
    });
  }

  private _removeNodeFromData(nodeToRemove: any, single = true): void {
    const _findTopSortOrder = (_node: any): any => {
      if (!_node) return undefined;
      if (typeof _node._defaultSortOrder === 'number')
        return _node._defaultSortOrder;
      return _findTopSortOrder(_node.parent);
    };

    const _removeFromChildren = (_node: any) => {
      if (!_node?.children) return false;
      const idx = _node.children.indexOf(nodeToRemove);
      if (idx >= 0) {
        _node.children.splice(idx, 1);
        if (_node.children.length === 0) {
          delete _node.children;
        }
        return true;
      } else {
        for (const child of _node.children) {
          if (_removeFromChildren(child)) return true;
        }
        return false;
      }
    };

    // locate top level node
    const sortOrder = _findTopSortOrder(nodeToRemove);
    if (sortOrder === undefined) return;
    const node = this.data.find((n) => n._defaultSortOrder === sortOrder);
    if (!node) return;

    // remove the node itself or remove its child
    if (nodeToRemove === node) {
      this.data = this.data.filter((v: any) => v !== nodeToRemove);
    } else {
      if (node.children) {
        _removeFromChildren(node);
        if (single) this.data = [...this.data];
      }
    }
  }

  toggleAllColumns() {
    this.selectedColumns =
      this.selectedColumns.length < this.columns.length ? this.columns : [];
    this.columnsSelected.emit(this.selectedColumns);
  }

  isColumnSelected(col: any) {
    return !!find(this.selectedColumns, (item) => isEqual(item, col));
  }

  onRowsPerPageChanged() {
    if (this.resetPageOnRowsChange) {
      this.primengTreeTable.first = 0;
    }
    this.changePage(this.getPage());
  }

  getPageCount() {
    return Math.ceil(this.primengTreeTable.totalRecords / this.rows);
  }

  getPage(): number {
    return Math.floor(this.primengTreeTable.first / this.rows);
  }

  changePage(p: number) {
    const pc = Math.ceil(this.getPageCount());

    if (p >= 0 && p < pc) {
      this.first = this.rows * p;
      this.primengTreeTable.onPageChange({
        first: this.first,
        rows: this.rows
      });
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

  onLazyLoaded(event: any) {
    this.lazyLoaded.emit(event);
  }

  onNodeExpanded(event: any) {
    this.nodeExpanded.emit(event);
    setTimeout(() => {
      this._recalcVirtualHeight();
      this.cdRef.markForCheck();
    });
  }

  onNodeCollapsed(event: any) {
    this.nodeCollapsed.emit(event);
    setTimeout(() => {
      this._recalcVirtualHeight();
      this.cdRef.markForCheck();
    });
  }

  onNodeSelected(event: any) {
    this.nodeSelected.emit(event);
  }

  onNodeUnselected(event: any) {
    this.nodeUnselected.emit(event);
  }

  onSort(event: any) {
    this.sorted.emit(event);
  }

  onFilter(event: any) {
    this.filtered.emit(event);
    setTimeout(() => {
      this._recalcVirtualHeight();
      this.cdRef.markForCheck();
    });
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

  onSelectionChanged(selection: any[]) {
    this.selectionChanged.emit(selection);
  }
}
