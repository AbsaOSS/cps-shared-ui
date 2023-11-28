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

/**
 * CpsTreeTableComponent is used to display hierarchical data in tabular format.
 * @group Components
 */
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
  /**
   * An array of objects to display.
   * @group Props
   */
  @Input() data: any[] = [];

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
   * Table min width.
   * @group Props
   */
  @Input() minWidth = 0;

  /**
   * Whether minWidth prop is used for table body only, excluding toolbar and paginator.
   * @group Props
   */
  @Input() minWidthForBodyOnly = true;

  /**
   * Whether the treetable should have alternating stripes.
   * @group Props
   */
  @Input() striped = true;

  /**
   * Whether the treetable should have borders.
   * @group Props
   */
  @Input() bordered = true;

  /**
   * Size of treetable cells, it can be "small", "normal" or "large".
   * @group Props
   */
  @Input() size: CpsTreeTableSize = 'normal';

  /**
   * Whether the treetable should have row selection.
   * @group Props
   */
  @Input() selectable = false;

  /**
   * Whether the treetable should have rows highlighting on hover.
   * @group Props
   */
  @Input() rowHover = true;

  /**
   * Whether the treetable should show row menu.
   * @group Props
   */
  @Input() showRowMenu = false;

  /**
   * When enabled, a loader component is displayed when data is being collected.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Inline style of the treetable.
   * @group Props
   */
  @Input() tableStyle = undefined;

  /**
   * Style class of the treetable.
   * @group Props
   */
  @Input() tableStyleClass = '';

  /**
   * Makes all columns sortable if columns prop is provided.
   * @group Props
   */
  @Input() sortable = false;

  /**
   * Defines whether sorting works on single column or on multiple columns.
   * @group Props
   */
  @Input() sortMode: CpsTreeTableSortMode = 'single';

  /**
   * Whether to use the default sorting or a custom one using sortFunction.
   * @group Props
   */
  @Input() customSort = false;

  /**
   * Whether the treetable has toolbar.
   * @group Props
   */
  @Input() hasToolbar = true;

  /**
   * Toolbar size, it can be "small" or "normal".
   * @group Props
   */
  @Input() toolbarSize: CpsTreeTableToolbarSize = 'normal';

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
   * Makes treetable scrollable.
   * @group Props
   */
  @Input() scrollable = true;

  /**
   * Height of the scroll viewport in fixed pixels or the "flex" keyword for a dynamic size.
   * @group Props
   */
  @Input() scrollHeight = '';

  /**
   * Whether the data should be loaded on demand during scroll. Works only if scrollable prop is true.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   * Maximum height of a virtual scroll item.
   * @group Props
   */
  @Input() maxVirtualScrollItemHeight = 0;

  /**
   * Determines how many additional elements to add to the DOM outside of the view. Default value is half the number of items shown in the view.
   * @group Props
   */
  @Input() numToleratedItems = 10;

  /**
   * Whether the treetable should have paginator.
   * @group Props
   */
  @Input() paginator = false;

  /**
   * Whether to show it even there is only one page.
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
   * Reset page on rows change.
   * @group Props
   */
  @Input() resetPageOnRowsChange = false;

  /**
   * Reset page on sort.
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
   * Height of treetable's body when there is no data, of type number denoting pixels or string.
   * @group Props
   */
  @Input() emptyBodyHeight: number | string = '';

  /**
   * Defines if data is loaded and interacted with in lazy manner.
   * @group Props
   */
  @Input() lazy = false;

  /**
   * Whether to call lazy loading on initialization.
   * @group Props
   */
  @Input() lazyLoadOnInit = true;

  /**
   * Whether to show global filter in the toolbar.
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
   * Whether to clear global filter on data loading.
   * @group Props
   */
  @Input() clearGlobalFilterOnLoading = false;

  /**
   * Show remove button in the toolbar when rows are selected.
   * @group Props
   */
  @Input() showRemoveBtnOnSelect = true;

  /**
   * Whether removeBtnOnSelect is disabled.
   * @group Props
   */
  @Input() removeBtnOnSelectDisabled = false;

  /**
   * Whether to show additional button in the toolbar when rows are selected.
   * @group Props
   */
  @Input() showAdditionalBtnOnSelect = false;

  /**
   * AdditionalBtnOnSelect title.
   * @group Props
   */
  @Input() additionalBtnOnSelectTitle = 'Select action';

  /**
   * Whether additionalBtnOnSelect is disabled.
   * @group Props
   */
  @Input() additionalBtnOnSelectDisabled = false;

  /**
   * Whether to show action button on table.
   * @group Props
   */
  @Input() showActionBtn = false;
  /**
   * Action button title.
   * @group Props
   */
  @Input() actionBtnTitle = 'Action';

  /**
   * Whether actionBtn is disabled.
   * @group Props
   */
  @Input() actionBtnDisabled = false;

  /**
   * Whether to show data reload button in the toolbar.
   * @group Props
   */
  @Input() showDataReloadBtn = false;

  /**
   * Whether dataReloadBtn is disabled.
   * @group Props
   */
  @Input() dataReloadBtnDisabled = false;

  /**
   * Whether the table should show columnsToggle menu, where you can choose which columns to be displayed. If external body template is provided, use columnsSelected event emitter.
   * @group Props
   */
  @Input() showColumnsToggleBtn = false;

  /**
   * Whether columnsToggle button is disabled.
   * @group Props
   */
  @Input() columnsToggleBtnDisabled = false;

  /**
   * Callback to invoke on selected node change.
   * @param {any[]} array - selection changed.
   * @group Emits
   */
  @Output() selectionChanged = new EventEmitter<any[]>();

  /**
   * Callback to invoke when action button is clicked.
   * @param {any} any - action button clicked.
   * @group Emits
   */
  @Output() actionBtnClicked = new EventEmitter<void>();

  /**
   * Callback to invoke when additional button on select is clicked.
   * @param {any[]} any[] - selected data.
   * @group Emits
   */
  @Output() additionalBtnOnSelectClicked = new EventEmitter<any[]>();

  /**
   * Callback to invoke when edit-row button is clicked.
   * @param {any} any - button clicked.
   * @group Emits
   */
  @Output() editRowBtnClicked = new EventEmitter<any>();

  /**
   * Callback to invoke when rows are removed.
   * @param {any} any - rows removed.
   * @group Emits
   */
  @Output() rowsRemoved = new EventEmitter<any[]>();

  /**
   * Callback to invoke when page is changed.
   * @param {any} any - page changed.
   * @group Emits
   */
  @Output() pageChanged = new EventEmitter<any>();

  /**
   * Callback to invoke when data is sorted.
   * @param {any} any - Sort data.
   * @group Emits
   */
  @Output() sorted = new EventEmitter<any>();

  /**
   * Callback to invoke when data is filtered.
   * @param {any} any - Custom filter event.
   * @group Emits
   */
  @Output() filtered = new EventEmitter<any>();

  /**
   * Callback to invoke on selected columns.
   * @param {any[]} object[] - selection changed.
   * @group Emits
   */
  @Output() columnsSelected = new EventEmitter<{ [key: string]: any }[]>();

  /**
   * Callback to invoke when paging, sorting or filtering happens in lazy mode.
   * @param {any} any - Custom lazy load event.
   * @group Emits
   */
  @Output() lazyLoaded = new EventEmitter<any>();

  /**
   * Callback to invoke when data reload button is clicked.
   * @param {any} any - data reload button clicked.
   * @group Emits
   */
  @Output() dataReloadBtnClicked = new EventEmitter<any>();

  /**
   * Callback to invoke when a node is expanded.
   * @param {any} any - Node instance.
   * @group Emits
   */
  @Output() nodeExpanded = new EventEmitter<any>();

  /**
   * Callback to invoke when a node is collapsed.
   * @param {any} any - Node collapse event.
   * @group Emits
   */
  @Output() nodeCollapsed = new EventEmitter<any>();

  /**
   * Callback to invoke when a node is selected.
   * @param {any} any - Node instance.
   * @group Emits
   */
  @Output() nodeSelected = new EventEmitter<any>();

  /**
   * Callback to invoke when a node is unselected.
   * @param {any} any - Custom node unselect event.
   * @group Emits
   */
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

  @ViewChild('colToggleMenu')
  colToggleMenu!: CpsMenuComponent;

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

  observerDebouncers = new WeakMap();
  observerHandlers = new WeakMap();

  // eslint-disable-next-line no-useless-constructor
  constructor(private cdRef: ChangeDetectorRef) {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (!this.observerHandlers.has(entry.target)) {
          this.observerHandlers.set(entry.target, () => {
            entry.target.dispatchEvent(new CustomEvent('treeTableBodyResized'));
          });
        }
        clearTimeout(this.observerDebouncers.get(entry.target));
        this.observerDebouncers.set(
          entry.target,
          setTimeout(this.observerHandlers.get(entry.target), 100)
        );

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
    this._setMinWidthOverall();

    this.scrollableBody = this.primengTreeTable.el.nativeElement.querySelector(
      '.p-treetable-scrollable-body'
    );
    if (this.scrollableBody) {
      if (this.minWidthForBodyOnly && this.minWidth > 0) {
        const table = this.scrollableBody.querySelector('table');
        if (table) table.style.minWidth = this.minWidth + 'px';
      }

      if (this.virtualScroll && this.defScrollHeight === 'flex')
        this.defScrollHeightPx = this.scrollableBody.clientHeight;

      this.headerBox = this.primengTreeTable.el.nativeElement.querySelector(
        '.p-treetable-scrollable-header-box'
      );

      if (this.headerBox) {
        if (this.minWidthForBodyOnly && this.minWidth > 0) {
          const table = this.headerBox.querySelector('table');
          if (table) table.style.minWidth = this.minWidth + 'px';
        }

        this.scrollbarWidth = DomHandler.calculateScrollbarWidth();

        this.scrollableBody.addEventListener('treeTableBodyResized', () => {
          this._recalcVirtualHeight();
        });

        this.resizeObserver.observe(this.scrollableBody);
      }
    }
  }

  private _updateVirtualScrollItemSize() {
    if (!this.virtualScroll) return;
    const tr = this.primengTreeTable?.el?.nativeElement
      ?.querySelector('.p-treetable-tbody')
      ?.querySelector('tr');

    if (tr) {
      this.virtualScrollItemSize = tr.clientHeight || 0;

      if (this.maxVirtualScrollItemHeight > 0) {
        this.virtualScrollItemSize = Math.min(
          this.maxVirtualScrollItemHeight,
          this.virtualScrollItemSize
        );
      }
    }
  }

  ngAfterViewChecked() {
    if (!this.virtualScroll || this.virtualScrollItemSize) return;
    this._recalcVirtualHeight();
    this.cdRef.detectChanges();
  }

  private _setMinWidthOverall() {
    if (this.minWidthForBodyOnly || !this.minWidth || !this.primengTreeTable)
      return;

    const treeTableMain =
      this.primengTreeTable.el?.nativeElement?.querySelector('.p-treetable');
    if (treeTableMain) {
      treeTableMain.style.overflow = 'auto';
      const paginatorEl = treeTableMain.querySelector('.p-paginator');
      if (paginatorEl) paginatorEl.style.minWidth = this.minWidth + 'px';
      const loadingOverlay = treeTableMain.querySelector(
        '.p-treetable-loading-overlay'
      );
      if (loadingOverlay) loadingOverlay.style.minWidth = this.minWidth + 'px';
    }

    const scrollableWrapper =
      this.primengTreeTable.el?.nativeElement?.querySelector(
        '.p-treetable-scrollable-wrapper'
      );
    if (scrollableWrapper)
      scrollableWrapper.style.minWidth = this.minWidth + 'px';

    const treeTableHeader =
      this.primengTreeTable.el?.nativeElement?.querySelector(
        '.p-treetable-header'
      );
    if (treeTableHeader) treeTableHeader.style.minWidth = this.minWidth + 'px';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loading) {
      this.clearSelection();
      if (this.clearGlobalFilterOnLoading) this.clearGlobalFilter();
    }

    this._setMinWidthOverall();

    const dataChanges = changes?.data;
    if (dataChanges?.previousValue !== dataChanges?.currentValue) {
      this.clearSelection();
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
    setTimeout(() => {
      if (this.virtualScroll && this.defScrollHeight) {
        this._updateVirtualScrollItemSize();
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
          this.scrollHeight =
            Math.min(this.defScrollHeightPx, curHeight) + 'px';
        }
        this.cdRef.markForCheck();
      }
    });
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
    if (this.dataReloadBtnDisabled) return;
    this.dataReloadBtnClicked.emit();
  }

  onColumnsToggle(event: any) {
    if (this.columnsToggleBtnDisabled) return;
    this.colToggleMenu?.toggle(event);
  }

  removeSelected() {
    this.selectedRows.forEach((row) => this._removeNodeFromData(row, false));
    this.data = [...this.data];
    this.rowsRemoved.emit(this.selectedRows);
    this.clearSelection();
    this._recalcVirtualHeight();
  }

  clearSelection() {
    this.selectedRows = [];
  }

  onEditRowClicked(node: any) {
    this.editRowBtnClicked.emit(node);
  }

  onRemoveRowClicked(node: any) {
    this.selectedRows = this.selectedRows.filter((v: any) => v !== node);
    this._removeNodeFromData(node);
    this.rowsRemoved.emit([node]);
    this._recalcVirtualHeight();
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
    this._recalcVirtualHeight();
  }

  onNodeCollapsed(event: any) {
    this.nodeCollapsed.emit(event);
    this._recalcVirtualHeight();
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
    this._recalcVirtualHeight();
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
