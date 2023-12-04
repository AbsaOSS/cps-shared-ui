import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  RendererStyleFlags2,
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
import { CpsTreeTableHeaderSelectableDirective } from './directives/cps-tree-table-header-selectable.directive';
import { CpsTreeTableRowSelectableDirective } from './directives/cps-tree-table-row-selectable.directive';
import { CpsTreetableRowTogglerDirective } from './directives/cps-tree-table-row-toggler.directive';
import { Subscription, fromEvent } from 'rxjs';

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
    CpsTreeTableHeaderSelectableDirective,
    CpsTreeTableRowSelectableDirective,
    CpsTreetableRowTogglerDirective,
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
  @Input() minWidth: number | string = '';
  @Input() minWidthForBodyOnly = true;

  /**
   * Whether the cell widths scale according to their content or not.
   * @group Props
   */
  @Input() autoLayout = true;

  @Input() striped = true;
  @Input() bordered = true;
  @Input() size: CpsTreeTableSize = 'normal';
  @Input() selectable = false;
  @Input() rowHover = true;
  @Input() showRowMenu = false;
  @Input() loading = false;

  @Input() tableStyle = undefined;
  @Input() tableStyleClass = '';

  @Input() sortable = false; // makes all sortable if columns are provided
  @Input() sortMode: CpsTreeTableSortMode = 'single';
  @Input() customSort = false;

  @Input() hasToolbar = true;
  @Input() toolbarSize: CpsTreeTableToolbarSize = 'normal';
  @Input() toolbarTitle = '';
  @Input() toolbarIcon = '';
  @Input() toolbarIconColor = '';

  @Input() scrollable = true;
  @Input() scrollHeight = ''; // 'flex' or value+'px'
  @Input() virtualScroll = false; // works only if scrollable is true
  @Input() virtualScrollItemHeight = 0;
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

  @Input() showDataReloadBtn = false;
  @Input() dataReloadBtnDisabled = false;

  @Input() showColumnsToggleBtn = false; // if external body template is provided, use columnsSelected event emitter
  @Input() columnsToggleBtnDisabled = false;

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

  @ViewChild('colToggleMenu')
  colToggleMenu!: CpsMenuComponent;

  selectedColumns: { [key: string]: any }[] = [];

  rowOptions: { label: string; value: number }[] = [];

  selectedRows: any[] = [];

  virtualScrollItemSize = 0;
  defScrollHeight = '';

  private _defScrollHeightPx = 0;
  private _defScrollHeightPxInitial = 0;

  private _resizeObserver: ResizeObserver;
  private _windowResizeDebouncer: any;
  private _scrollSubscription?: Subscription;

  private _headerBox: any;
  private _scrollableBody: any;
  private _scrollbarWidth = 0;
  private _scrollbarVisible = true;

  private _needRecalcAutoLayout = true;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private cdRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {
    this._resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const body = entry.target;
        this._scrollbarVisible = body.scrollHeight > body.clientHeight;

        if (this._scrollbarVisible && this.virtualScroll)
          this.renderer.setStyle(
            this._scrollableBody,
            'overflow',
            'auto',
            RendererStyleFlags2.Important
          );

        let wScroll = this._scrollbarVisible ? this._scrollbarWidth : 0;
        if (wScroll > 0) wScroll -= 1;

        this.renderer.setStyle(
          this._headerBox,
          'padding-right',
          `${wScroll}px`
        );
        this.renderer.setStyle(
          this._headerBox,
          'border-right',
          wScroll > 0 ? '1px solid #d7d5d5' : 'unset'
        );
      });
    });
  }

  ngOnInit(): void {
    if (!this.scrollable) this.virtualScroll = false;
    this.emptyBodyHeight = convertSize(this.emptyBodyHeight);
    this.minWidth = convertSize(this.minWidth);

    if (this.showAdditionalBtnOnSelect) this.showRemoveBtnOnSelect = false;

    this.defScrollHeight = this.scrollHeight;
    if (this.virtualScroll) {
      window.addEventListener('resize', this._onWindowResize.bind(this));

      if (this.defScrollHeight && this.defScrollHeight !== 'flex') {
        this._defScrollHeightPx = parseInt(this.scrollHeight, 10);
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

    this._scrollableBody = this.primengTreeTable.el.nativeElement.querySelector(
      '.p-treetable-scrollable-body'
    );
    if (this._scrollableBody) {
      if (this.minWidthForBodyOnly && this.minWidth) {
        const table = this._scrollableBody.querySelector('table');
        if (table) this.renderer.setStyle(table, 'min-width', this.minWidth);
      }

      if (this.virtualScroll) {
        if (this.defScrollHeight === 'flex') {
          this._defScrollHeightPx = this._scrollableBody.clientHeight;
          this._defScrollHeightPxInitial = this._defScrollHeightPx;
        }
        if (this.autoLayout) {
          this._scrollSubscription = fromEvent(
            this._scrollableBody,
            'scroll'
          ).subscribe(() => {
            this._calcAutoLayoutHeaderWidths(true);
          });
        }
      }

      this._headerBox = this.primengTreeTable.el.nativeElement.querySelector(
        '.p-treetable-scrollable-header-box'
      );

      if (this._headerBox) {
        if (this.minWidthForBodyOnly && this.minWidth) {
          const table = this._headerBox.querySelector('table');
          if (table) this.renderer.setStyle(table, 'min-width', this.minWidth);
        }

        this._scrollbarWidth = DomHandler.calculateScrollbarWidth();
        this._resizeObserver.observe(this._scrollableBody);
      }

      if (this._needRecalcAutoLayout) {
        this._calcAutoLayoutHeaderWidths();
        this.cdRef.detectChanges();
      }
    }

    if (!this.scrollable) {
      const tableWrapper =
        this.primengTreeTable.el?.nativeElement?.querySelector(
          '.p-treetable-wrapper'
        );
      if (tableWrapper && this.minWidthForBodyOnly && this.minWidth) {
        const table = tableWrapper.querySelector('table');
        if (table) this.renderer.setStyle(table, 'min-width', this.minWidth);
      }
    }
  }

  ngAfterViewChecked() {
    if (this._needRecalcAutoLayout) {
      this._calcAutoLayoutHeaderWidths();
      this.cdRef.detectChanges();
    }
    if (!this.virtualScroll) return;

    if (!this._defScrollHeightPx && this.defScrollHeight === 'flex') {
      this._defScrollHeightPx = this._scrollableBody.clientHeight;
      this._defScrollHeightPxInitial = this._defScrollHeightPx;
      this.cdRef.detectChanges();
    }

    if (!this.virtualScrollItemSize) {
      this._recalcVirtualHeight();
      this.cdRef.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loading) {
      this.clearSelection();
      if (this.clearGlobalFilterOnLoading) this.clearGlobalFilter();
    }

    if (this.virtualScrollItemHeight)
      this.virtualScrollItemSize = this.virtualScrollItemHeight;

    this._setMinWidthOverall();

    const dataChanges = changes?.data;
    if (dataChanges?.previousValue !== dataChanges?.currentValue) {
      this.clearSelection();
    }
    this._recalcVirtualHeight();
    this._calcAutoLayoutHeaderWidths(true);
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
    if (this.virtualScroll) {
      if (this.autoLayout) this._scrollSubscription?.unsubscribe();
      window.removeEventListener('resize', this._onWindowResize.bind(this));
    }
  }

  private _calcAutoLayoutHeaderWidths(forced = false) {
    this.ngZone.runOutsideAngular(() => {
      if (!this.autoLayout || !this.scrollable) return;

      if (!this._needRecalcAutoLayout && !forced) return;

      const headerRows = this._headerBox?.querySelectorAll('tr');
      if (!headerRows?.length) return;

      const headerCells =
        headerRows[headerRows.length - 1]?.querySelectorAll('th');
      if (!headerCells?.length) return;

      let hasSelectableCell = false;
      let hasRowMenuCell = false;

      const ths = Array.from(headerCells);
      if (ths.every((th: any) => th.offsetWidth === 0)) return;

      const thWidths = ths.map((th: any) => {
        const wprev = th.style.width;

        const isSelectableCell = th.classList.contains(
          'cps-treetable-selectable-cell'
        );

        const isRowCell = th.classList.contains('cps-treetable-row-menu-cell');

        if (isSelectableCell) hasSelectableCell = true;
        if (isRowCell) hasRowMenuCell = true;

        let thWidth = 55;
        if (!isSelectableCell && !isRowCell) {
          this.renderer.setStyle(th, 'width', 'min-content');
          this.renderer.setStyle(th, 'display', 'block');
          thWidth = th.offsetWidth;
          this.renderer.setStyle(th, 'width', wprev);
          this.renderer.removeStyle(th, 'display');
        }
        return thWidth;
      });

      const bodyRows = this._scrollableBody?.querySelectorAll('tr');
      if (!bodyRows?.length) return;

      const tdWidths: number[] = [];
      const fragment = document.createDocumentFragment();
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.visibility = 'hidden';
      hiddenDiv.style.position = 'absolute';
      hiddenDiv.style.whiteSpace = 'nowrap';

      document.body.appendChild(hiddenDiv);
      bodyRows.forEach((tr: HTMLElement) => {
        const tds = tr?.querySelectorAll('td');
        tds?.forEach((td: HTMLElement, idx: number) => {
          const isSelectableOrRowMenuCell =
            td.classList.contains('cps-treetable-selectable-cell') ||
            td.classList.contains('cps-treetable-row-menu-cell');

          let tdWidth = 55;
          if (!isSelectableOrRowMenuCell) {
            const clonedTd = td.cloneNode(true) as HTMLElement;
            fragment.appendChild(clonedTd);
            this.renderer.setStyle(clonedTd, 'width', 'min-content');
            this.renderer.setStyle(clonedTd, 'display', 'block');
            hiddenDiv.innerHTML = clonedTd.innerHTML;
            hiddenDiv.style.width = 'auto';
            tdWidth = hiddenDiv.offsetWidth;
            fragment.removeChild(clonedTd);
          }
          if (!tdWidths[idx]) tdWidths[idx] = 0;
          tdWidths[idx] = Math.max(tdWidths[idx], tdWidth);
        });
      });
      document.body.removeChild(hiddenDiv);

      if (thWidths.length !== tdWidths.length) return;

      const maxWidths = thWidths.map((v, idx) => Math.max(v, tdWidths[idx]));
      let sum = maxWidths.reduce((a, b) => a + b, 0);
      if (hasSelectableCell) {
        sum -= 55;
        maxWidths.shift();
      }
      if (hasRowMenuCell) {
        sum -= 55;
        maxWidths.pop();
      }

      const percentages = maxWidths.map((v) => (v / sum) * 100);

      headerCells.forEach((th: any, idx: number) => {
        if (
          (hasSelectableCell && idx === 0) ||
          (hasRowMenuCell && idx === headerCells.length - 1)
        ) {
          this.renderer.setStyle(th, 'width', '55px');
        } else
          this.renderer.setStyle(
            th,
            'width',
            percentages[hasSelectableCell ? idx - 1 : idx] + '%'
          );
      });

      bodyRows.forEach((tr: HTMLElement) => {
        const tds = tr?.querySelectorAll('td');
        tds?.forEach((td: HTMLElement, idx: number) => {
          if (
            (hasSelectableCell && idx === 0) ||
            (hasRowMenuCell && idx === tds.length - 1)
          ) {
            this.renderer.setStyle(td, 'width', '55px');
          } else {
            this.renderer.setStyle(
              td,
              'width',
              percentages[hasSelectableCell ? idx - 1 : idx] + '%'
            );
          }
          this.renderer.setStyle(td, 'opacity', '1');
          this.renderer.setStyle(td, 'overflow', 'hidden');
          if (this.bordered)
            this.renderer.setStyle(
              td,
              'border-left-color',
              'var(--cps-color-line-mid)'
            );
        });
      });

      this._needRecalcAutoLayout = false;
    });
  }

  private _updateVirtualScrollItemSize() {
    if (!this.virtualScroll || this.virtualScrollItemHeight) return;

    const trs = this.primengTreeTable?.el?.nativeElement
      ?.querySelector('.p-treetable-tbody')
      ?.querySelectorAll('tr');

    if (!trs?.length) return;
    if (!trs[0]?.offsetHeight) return;

    let h = 0;
    trs.forEach((tr: HTMLElement, idx: number) => {
      let rh = 0;
      const tds = tr?.querySelectorAll('td');
      tds?.forEach((td: HTMLElement) => {
        this.renderer.setStyle(td, 'display', 'block');
        if (td.offsetHeight) rh = Math.max(rh, td.offsetHeight);
        this.renderer.removeStyle(td, 'display');
      });
      if (rh) {
        h = idx === 0 ? rh : Math.min(h, rh);
      }
    });

    this.virtualScrollItemSize = h;
  }

  private _setMinWidthOverall() {
    if (this.minWidthForBodyOnly || !this.minWidth || !this.primengTreeTable)
      return;

    const treeTableMain =
      this.primengTreeTable.el?.nativeElement?.querySelector('.p-treetable');
    if (treeTableMain) {
      this.renderer.setStyle(treeTableMain, 'overflow', 'auto');
      const paginatorEl = treeTableMain.querySelector('.p-paginator');
      if (paginatorEl)
        this.renderer.setStyle(paginatorEl, 'min-width', this.minWidth);
      const loadingOverlay = treeTableMain.querySelector(
        '.p-treetable-loading-overlay'
      );
      if (loadingOverlay)
        this.renderer.setStyle(loadingOverlay, 'min-width', this.minWidth);
    }

    const scrollableWrapper =
      this.primengTreeTable.el?.nativeElement?.querySelector(
        '.p-treetable-scrollable-wrapper'
      );
    if (scrollableWrapper)
      this.renderer.setStyle(scrollableWrapper, 'min-width', this.minWidth);

    if (!this.scrollable) {
      const tableWrapper =
        this.primengTreeTable.el?.nativeElement?.querySelector(
          '.p-treetable-wrapper'
        );
      if (tableWrapper)
        this.renderer.setStyle(tableWrapper, 'min-width', this.minWidth);
    }

    const treeTableHeader =
      this.primengTreeTable.el?.nativeElement?.querySelector(
        '.p-treetable-header'
      );
    if (treeTableHeader)
      this.renderer.setStyle(treeTableHeader, 'min-width', this.minWidth);
  }

  private _onWindowResize() {
    // if (this.defScrollHeight === 'flex')
    //   this.defScrollHeightPx = this.scrollableBody.clientHeight;

    clearTimeout(this._windowResizeDebouncer);
    this._windowResizeDebouncer = setTimeout(() => {
      this._recalcVirtualHeight();
    }, 100);
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

  private _recalcVirtualHeight() {
    if (!this._scrollbarVisible && this.virtualScroll)
      this.renderer.setStyle(
        this._scrollableBody,
        'overflow',
        'hidden',
        RendererStyleFlags2.Important
      );

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
            if (curHeight >= this._defScrollHeightPxInitial) {
              this.scrollHeight = 'flex';
              this.renderer.setStyle(this._scrollableBody, 'height', '100%');
              this.cdRef.markForCheck();
              return;
            }
          }
          this.scrollHeight =
            Math.min(this._defScrollHeightPx, curHeight) + 'px';
        }
        this.cdRef.markForCheck();
      }
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

  clearGlobalFilter() {
    this.globalFilterComp?.clear();
  }

  onSortFunction(event: SortEvent) {
    this.customSortFunction.emit(event);
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
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
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
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  toggleAllColumns() {
    this.selectedColumns =
      this.selectedColumns.length < this.columns.length ? this.columns : [];
    this.columnsSelected.emit(this.selectedColumns);
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
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
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  onLazyLoaded(event: any) {
    this.lazyLoaded.emit(event);
  }

  onNodeExpanded(event: any) {
    this.nodeExpanded.emit(event);
    this._recalcVirtualHeight();
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  onNodeCollapsed(event: any) {
    this.nodeCollapsed.emit(event);
    this._recalcVirtualHeight();
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
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
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  onFilter(event: any) {
    this.filtered.emit(event);
    this._recalcVirtualHeight();
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
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
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  onSelectionChanged(selection: any[]) {
    this.selectionChanged.emit(selection);
  }
}
