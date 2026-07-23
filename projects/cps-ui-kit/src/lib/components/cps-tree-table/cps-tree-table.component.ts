import { CommonModule, DOCUMENT } from '@angular/common';
import type { PaginatorPassThrough } from 'primeng/types/paginator';
import type { TreeTablePassThrough } from 'primeng/types/treetable';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  inject,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  RendererStyleFlags2,
  type SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { cloneDeep } from 'lodash-es';
import { DomHandler } from 'primeng/dom';
import {
  TreeTable,
  TreeTableModule,
  TreeTableService,
  TreeTableSortEvent,
  TreeTableStyle
} from 'primeng/treetable';
import { Subscription, fromEvent } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import { CpsButtonComponent } from '../cps-button/cps-button.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { CpsLoaderComponent } from '../cps-loader/cps-loader.component';
import { CpsMenuItem } from '../cps-menu/cps-menu.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { TableColumnVisibilityToggleComponent } from '../cps-table/components/internal/table-column-visibility-toggle/table-column-visibility-toggle.component';
import { TableRowMenuComponent } from '../cps-table/components/internal/table-row-menu/table-row-menu.component';
import { CpsTreeTableColumnFilterDirective } from './directives/cps-tree-table-column-filter/cps-tree-table-column-filter.directive';
import { CpsTreeTableColumnResizableDirective } from './directives/cps-tree-table-column-resizable/cps-tree-table-column-resizable.directive';
import { CpsTreeTableColumnSortableDirective } from './directives/cps-tree-table-column-sortable/cps-tree-table-column-sortable.directive';
import { CpsTreeTableHeaderSelectableDirective } from './directives/cps-tree-table-header-selectable/cps-tree-table-header-selectable.directive';
import { CpsTreeTableRowSelectableDirective } from './directives/cps-tree-table-row-selectable/cps-tree-table-row-selectable.directive';
import { CpsTreetableRowTogglerDirective } from './directives/cps-tree-table-row-toggler/cps-tree-table-row-toggler.directive';
import { TreeTableUnsortDirective } from './directives/internal/tree-table-unsort/tree-table-unsort.directive';
import { CpsTreeTableDetectFilterTypePipe } from './pipes/cps-tree-table-detect-filter-type/cps-tree-table-detect-filter-type.pipe';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';

export function treeTableFactory(tableComponent: CpsTreeTableComponent) {
  return tableComponent.primengTreeTable;
}

const DEFAULT_CELL_WIDTH_REM = 3.4375;

/**
 * CpsTreeTableSize is used to define the size of the tree table.
 * @group Types
 */
export type CpsTreeTableSize = 'small' | 'normal' | 'large';

/**
 * CpsTreeTableToolbarSize is used to define the size of the tree table toolbar.
 * @group Types
 */
export type CpsTreeTableToolbarSize = 'small' | 'normal';

/**
 * CpsTreeTableSortMode is used to define the sorting mode of the tree table.
 * @group Types
 */
export type CpsTreeTableSortMode = 'single' | 'multiple';

/**
 * CpsTreeTableComponent is used to display hierarchical data in tabular format.
 * @group Components
 */
@Component({
  selector: 'cps-tree-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onPaginatorKeydown($event)'
  },
  imports: [
    FormsModule,
    CommonModule,
    TreeTableModule,
    CpsInputComponent,
    CpsButtonComponent,
    CpsIconComponent,
    TableColumnVisibilityToggleComponent,
    CpsSelectComponent,
    CpsLoaderComponent,
    CpsTreeTableColumnSortableDirective,
    CpsTreeTableColumnFilterDirective,
    CpsTreeTableHeaderSelectableDirective,
    CpsTreeTableRowSelectableDirective,
    CpsTreetableRowTogglerDirective,
    CpsTreeTableColumnResizableDirective,
    TreeTableUnsortDirective,
    TableRowMenuComponent,
    CpsTreeTableDetectFilterTypePipe
  ],
  templateUrl: './cps-tree-table.component.html',
  styleUrls: ['./cps-tree-table.component.scss'],
  providers: [
    TreeTableStyle,
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
   * A key used to retrieve the filter type from columns.
   * @group Props
   */
  @Input() colFilterTypeName = 'filterType';

  /**
   * A key used to retrieve the date format from columns.
   * @group Props
   */
  @Input() colDateFormatName = 'dateFormat';

  /**
   * Treetable min width of type number denoting pixels or string.
   * @group Props
   */
  @Input() minWidth: number | string = '';

  /**
   * Determines whether minWidth prop is used for treetable body only, excluding toolbar and paginator.
   * @group Props
   */
  @Input() minWidthForBodyOnly = true;

  /**
   * Determines whether the cell widths scale according to their content or not.
   * @group Props
   */
  @Input() autoLayout = true;

  /**
   * Determines whether the treetable should have alternating stripes.
   * @group Props
   */
  @Input() striped = true;

  /**
   * Determines whether the treetable should have borders.
   * @group Props
   */
  @Input() bordered = true;

  /**
   * Size of treetable cells, it can be "small", "normal" or "large".
   * @group Props
   */
  @Input() size: CpsTreeTableSize = 'normal';

  /**
   * Determines whether the treetable should have row selection.
   * @group Props
   */
  @Input() selectable = false;

  /**
   * Determines whether the treetable should have rows highlighting on hover.
   * @group Props
   */
  @Input() rowHover = true;

  /**
   * Determines whether the treetable should show row menus.
   * @group Props
   */
  @Input() showRowMenu = false;

  /**
   * Determines whether the 'Remove' button should be displayed in the row menu.
   * Note: This setting only takes effect if 'showRowMenu' is true and 'rowMenuItems' is not set.
   * @group Props
   */
  @Input() showRowRemoveButton = true;

  /**
   * Determines whether the 'Edit' button should be displayed in the row menu.
   * Note: This setting only takes effect if 'showRowMenu' is true and 'rowMenuItems' is not set.
   * @group Props
   */
  @Input() showRowEditButton = true;

  /**
   * Custom items to be displayed in the row menu.
   * Note: This setting only takes effect if 'showRowMenu' is true.
   * @group Props
   */
  @Input() rowMenuItems?: CpsMenuItem[];

  /**
   * When enabled, a loader component is displayed.
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
   * Determines whether sorting works on single column or on multiple columns.
   * @group Props
   */
  @Input() sortMode: CpsTreeTableSortMode = 'single';

  /**
   * Determines whether to use the default sorting or a custom one using sortFunction.
   * @group Props
   */
  @Input() customSort = false;

  /**
   * Determines whether the treetable has a toolbar.
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
   * Determines whether only the elements within scrollable area should be added into the DOM. Works only if scrollable prop is true.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   * Height of a virtual scroll item in fixed pixels.
   * @group Props
   */
  @Input() virtualScrollItemHeight = 0;

  /**
   * Determines how many additional elements to add to the DOM outside of the view.
   * @group Props
   */
  @Input() numToleratedItems = 10;

  /**
   * Determines whether the treetable should have paginator.
   * @group Props
   */
  @Input() paginator = false;

  /**
   * Determines whether to show paginator even there is only one page.
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
   * Determines whether to reset page on treetable data sorting.
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
   * Determines whether the treetable should show columnsToggle menu, where you can choose which columns to be displayed. If external body template is provided, use columnsSelected event emitter.
   * @group Props
   */
  @Input() showColumnsToggleBtn = false;

  /**
   * Determines whether columnsToggle button is disabled.
   * @group Props
   */
  @Input() columnsToggleBtnDisabled = false;

  /**
   * Array of initial columns to show in the treetable. If not provided, all columns are initially visible.
   * @group Props
   */
  @Input() initialColumns: { [key: string]: any }[] = [];

  /**
   * Enable filtering on all columns.
   * @group Props
   */
  @Input() filterableByColumns = false;

  /**
   * If true, automatically detects filter type based on values, otherwise sets 'text' filter type for all columns.
   * Note: This setting only takes effect if 'filterableByColumns' is true.
   * @group Props
   */
  @Input() autoColumnFilterType = true;

  /**
   * Determines whether to show export button in the toolbar.
   * @group Props
   */
  @Input() showExportBtn = false;

  /**
   * Determines whether export button is disabled.
   * @group Props
   */
  @Input() exportBtnDisabled = false;

  /**
   * Filename to use when exporting data (without extension).
   * @group Props
   */
  @Input() exportFilename = 'export';

  /**
   * Original source data to use for export instead of processed tree table data.
   * @group Props
   */
  @Input() exportOriginalData: any[] = [];

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
    const clone = cloneDeep(value);
    if (clone && clone.length > 0) {
      let i = 0;
      clone.forEach((v: any) => {
        v._defaultSortOrder = i++;
      });
    }
    this._data = clone;
  }

  get data(): any[] {
    return this._data;
  }

  /**
   * Determines whether columns are resizable.
   * In case of using a custom template for columns, it is also needed to add cpsTTColResizable directive to th elements.
   * @group Props
   */
  @Input() resizableColumns = false;

  /**
   * Determines how the columns are resized. It can be 'fit' (total width of the table stays the same) or 'expand' (total width of the table changes when resizing columns).
   * Note: This setting only takes effect if 'resizableColumns' is true.
   *
   * @group Props
   */
  @Input() columnResizeMode: 'fit' | 'expand' = 'fit';

  /**
   * Callback to invoke on selected rows change.
   * @param {any[]} any[] - selected rows.
   * @group Emits
   */
  @Output() rowsSelected = new EventEmitter<any[]>();

  /**
   * Callback to invoke when action button is clicked.
   * @param {void} void - action button clicked.
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
   * @param {any[]} any[] - array of rows to remove.
   * @group Emits
   */
  @Output() rowsToRemove = new EventEmitter<any[]>();

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

  @ContentChild('colgroup', { static: false })
  public colgroupTemplate?: TemplateRef<any>;

  @ViewChild('primengTreeTable', { static: true })
  primengTreeTable!: TreeTable;

  @ViewChild('globalFilterComp')
  globalFilterComp!: CpsInputComponent;

  selectedColumns: { [key: string]: any }[] = [];

  rowOptions: { label: string; value: number }[] = [];

  selectedRows: any = [];

  virtualScrollItemSize = 0;
  defScrollHeight = '';
  treeTablePassthrough: TreeTablePassThrough = {};

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

  private _data: any[] = [];

  private window: Window;

  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);

  private get _rootFontSizePx(): number {
    return this._cpsRootFontSizeService?.fontSize() || 16;
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    private _elementRef: ElementRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {
    this.window = this.document.defaultView as Window;
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
          wScroll > 0 ? '0.0625rem solid #d7d5d5' : 'unset'
        );

        this._calcAutoLayoutHeaderWidths();
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
      this.window.addEventListener('resize', this._onWindowResize.bind(this));
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

    this.selectedColumns =
      this.initialColumns.length > 0 ? this.initialColumns : this.columns;

    this.treeTablePassthrough = this._buildTreeTablePassthrough();
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
        this._scrollableBody.tabIndex = -1;
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

      this._removeEmptyFooter();
    }
  }

  /**
   * PrimeNG's non-scrollable p-treeTable view always renders a
   * `<tfoot role="rowgroup">`, even with no footer template provided,
   * leaving an empty rowgroup that violates aria-required-children.
   * The scrollable view correctly omits it in that case, so this only
   * needs to run here.
   */
  private _removeEmptyFooter(): void {
    const tfoot =
      this.primengTreeTable.el?.nativeElement?.querySelector(
        '.p-treetable-tfoot'
      );
    if (tfoot && tfoot.childElementCount === 0 && tfoot.parentNode) {
      this.renderer.removeChild(tfoot.parentNode, tfoot);
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
      setTimeout(() => {
        this._recalcVirtualHeight();
        this.cdRef.detectChanges();
      });
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
      setTimeout(() => {
        this._calcAutoLayoutHeaderWidths(true);
      });
    }

    this._calcAutoLayoutHeaderWidths(true);
    this._recalcVirtualHeight();

    if (changes.first || changes.totalRecords || changes.paginator) {
      this.treeTablePassthrough = this._buildTreeTablePassthrough();
    }
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
    if (this.virtualScroll) {
      if (this.autoLayout) this._scrollSubscription?.unsubscribe();
      this.window.removeEventListener(
        'resize',
        this._onWindowResize.bind(this)
      );
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

      const defaultCellWidthPx = DEFAULT_CELL_WIDTH_REM * this._rootFontSizePx;

      const ths = Array.from(headerCells);
      if (ths.every((th: any) => th.offsetWidth === 0)) return;

      const hiddenDiv = this.renderer.createElement('div');
      this.renderer.setStyle(hiddenDiv, 'visibility', 'hidden');
      this.renderer.setStyle(hiddenDiv, 'position', 'absolute');
      this.renderer.setStyle(hiddenDiv, 'white-space', 'nowrap');
      this.renderer.appendChild(this.document.body, hiddenDiv);

      const thWidths = ths.map((th: any) => {
        const isSelectableCell = th.classList.contains(
          'cps-treetable-selectable-cell'
        );

        const isRowCell = th.classList.contains('cps-treetable-row-menu-cell');

        if (isSelectableCell) hasSelectableCell = true;
        if (isRowCell) hasRowMenuCell = true;

        if (isSelectableCell || isRowCell) return defaultCellWidthPx;

        hiddenDiv.innerHTML = th.innerHTML;
        hiddenDiv.style.width = 'auto';
        return hiddenDiv.offsetWidth;
      });

      const bodyRows = this._scrollableBody?.querySelectorAll('tr');
      if (!bodyRows?.length) {
        this.renderer.removeChild(this.document.body, hiddenDiv);
        return;
      }

      const tdWidths: number[] = [];
      const fragment = this.document.createDocumentFragment();

      bodyRows.forEach((tr: HTMLElement) => {
        const tds = tr?.querySelectorAll('td');
        tds?.forEach((td: HTMLElement, idx: number) => {
          const isSelectableOrRowMenuCell =
            td.classList.contains('cps-treetable-selectable-cell') ||
            td.classList.contains('cps-treetable-row-menu-cell');

          let tdWidth = defaultCellWidthPx;
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
      this.renderer.removeChild(this.document.body, hiddenDiv);

      if (thWidths.length !== tdWidths.length) return;

      const maxWidths = thWidths.map((v, idx) => Math.max(v, tdWidths[idx]));
      let sum = maxWidths.reduce((a, b) => a + b, 0);
      if (hasSelectableCell) {
        sum -= defaultCellWidthPx;
        maxWidths.shift();
      }
      if (hasRowMenuCell) {
        sum -= defaultCellWidthPx;
        maxWidths.pop();
      }

      const percentages = maxWidths.map((v) => (v / sum) * 100);

      headerCells.forEach((th: any, idx: number) => {
        if (
          (hasSelectableCell && idx === 0) ||
          (hasRowMenuCell && idx === headerCells.length - 1)
        ) {
          this.renderer.setStyle(th, 'width', `${DEFAULT_CELL_WIDTH_REM}rem`);
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
            this.renderer.setStyle(td, 'width', `${DEFAULT_CELL_WIDTH_REM}rem`);
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
        const wprev = td.style.width;
        this.renderer.setStyle(td, 'display', 'block');
        this.renderer.removeStyle(td, 'width');
        if (td.offsetHeight) rh = Math.max(rh, td.offsetHeight);
        this.renderer.removeStyle(td, 'display');
        this.renderer.setStyle(td, 'width', wprev);
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
        const itemsLen = this.primengTreeTable.serializedValue?.length || 0;
        if (itemsLen < 1) {
          this.scrollHeight = this.emptyBodyHeight
            ? (`calc(${this.emptyBodyHeight} + ${0.0625 * this._rootFontSizePx}px)` as string)
            : this.virtualScrollItemSize + 0.0625 * this._rootFontSizePx + 'px';
        } else {
          const curHeight =
            this.virtualScrollItemSize * itemsLen +
            0.125 * this._rootFontSizePx;
          if (this.defScrollHeight === 'flex') {
            if (curHeight >= this._defScrollHeightPxInitial) {
              this.scrollHeight = 'flex';
              this.renderer.setStyle(this._scrollableBody, 'height', '100%');
              this.cdRef.markForCheck();
              return;
            }
            this.scrollHeight =
              Math.min(this._defScrollHeightPx, curHeight) + 'px';
          } else {
            this.scrollHeight = `min(${this.defScrollHeight}, ${curHeight}px)`;
          }
        }
        this.cdRef.markForCheck();
      }
    });
  }

  clearGlobalFilter() {
    this.globalFilterComp?.clear();
  }

  onSortFunction(event: TreeTableSortEvent) {
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

  removeSelected() {
    this.rowsToRemove.emit(this.selectedRows);
  }

  clearSelection() {
    this.selectedRows = [];
  }

  onEditRowClicked(node: any) {
    this.editRowBtnClicked.emit(node);
  }

  onRemoveRowClicked(node: any) {
    this.rowsToRemove.emit([node]);
  }

  onSelectedColumnsChange(cols: { [key: string]: any }[]) {
    this.selectedColumns = cols;
    this.columnsSelected.emit(cols);
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
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

  private _buildTreeTablePassthrough(): TreeTablePassThrough {
    const pt: TreeTablePassThrough = {};
    if (this.paginator) {
      const effectiveTotalRecords = this.lazy
        ? this.totalRecords
        : (this.data?.length ?? 0);
      const firstDisabled = this.first === 0 || effectiveTotalRecords === 0;
      const paginatorPt: PaginatorPassThrough = {
        first: {
          'aria-disabled': firstDisabled ? 'true' : null,
          tabindex: firstDisabled ? -1 : 0
        }
      };
      pt.pcPaginator = paginatorPt;
    }
    return pt;
  }

  onPaginatorKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const target = event.target as HTMLElement;
    if (!target.classList.contains('p-paginator-page')) return;

    event.preventDefault();
    const pageButtons = this._getPaginatorPageButtons();
    const currentIndex = pageButtons.indexOf(target as HTMLButtonElement);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const targetIndex = currentIndex + delta;

    if (targetIndex >= 0 && targetIndex < pageButtons.length) {
      pageButtons[targetIndex].focus();
      pageButtons[targetIndex].click();
    } else {
      const focusedPageNum = parseInt(
        (target as HTMLButtonElement).textContent?.trim() || '1',
        10
      );
      const atBoundary =
        delta > 0 ? focusedPageNum >= this.getPageCount() : focusedPageNum <= 1;
      if (!atBoundary) {
        this.changePage(focusedPageNum - 1 + delta);
        setTimeout(() => this._focusPaginatorSelectedPage());
      }
    }
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.treeTablePassthrough = this._buildTreeTablePassthrough();

    const state = {
      page: this.getPage(),
      first: this.first,
      rows: this.rows,
      pageCount: Math.ceil(this.getPageCount())
    };

    this.pageChanged.emit(state);

    const activeEl = this.document.activeElement as HTMLElement | null;
    const atFirst = this.first === 0;
    const atLast = this.first + this.rows >= this.primengTreeTable.totalRecords;
    if (
      (atFirst &&
        (activeEl?.classList.contains('p-paginator-first') ||
          activeEl?.classList.contains('p-paginator-prev'))) ||
      (atLast &&
        (activeEl?.classList.contains('p-paginator-last') ||
          activeEl?.classList.contains('p-paginator-next')))
    ) {
      setTimeout(() => this._focusPaginatorSelectedPage());
    }

    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  private _getPaginatorPageButtons(): HTMLButtonElement[] {
    return Array.from(
      this._elementRef.nativeElement.querySelectorAll('.p-paginator-page')
    ) as HTMLButtonElement[];
  }

  private _focusPaginatorSelectedPage(): void {
    const selected = this._elementRef.nativeElement.querySelector(
      '.p-paginator-page[aria-current="page"]'
    ) as HTMLButtonElement | null;
    selected?.focus();
  }

  onLazyLoaded(event: any) {
    this.lazyLoaded.emit(event);
  }

  onNodeExpanded(event: any) {
    this.nodeExpanded.emit(event);
    queueMicrotask(() => {
      this.cdRef.detectChanges();
      this._calcAutoLayoutHeaderWidths(true);
    });
    this._recalcVirtualHeight();
  }

  onNodeCollapsed(event: any) {
    this.nodeCollapsed.emit(event);
    queueMicrotask(() => {
      this.cdRef.detectChanges();
      this._calcAutoLayoutHeaderWidths(true);
    });
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
    setTimeout(() => {
      this.cdRef.detectChanges();
      this._calcAutoLayoutHeaderWidths(true);
    });
  }

  onFilter(event: any) {
    this.filtered.emit(event);
    setTimeout(() => {
      this._calcAutoLayoutHeaderWidths(true);
    });
    this._recalcVirtualHeight();
  }

  onSelectionChanged(selection: any) {
    if (selection && !Array.isArray(selection)) selection = [selection];
    this.rowsSelected.emit(selection);
  }

  onExportData() {
    if (this.exportBtnDisabled) return;
    this.exportJSON();
  }

  exportJSON() {
    try {
      const exportData = this.getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json;charset=utf-8'
      });

      const downloadLink = this.document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${this.exportFilename}.json`;
      downloadLink.click();
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  }

  getExportData(): any[] {
    // If original data is provided, use it directly for export
    if (this.exportOriginalData && this.exportOriginalData.length > 0) {
      return this.exportOriginalData;
    }

    // Create a deep copy of the tree data without circular references
    return this.removeCircularReferences(this.primengTreeTable?.value || []);
  }

  private removeCircularReferences(nodes: any[]): any[] {
    return nodes.map((node) => {
      const cleanNode: any = {};

      // Copy all properties except 'parent' to avoid circular references
      Object.keys(node).forEach((key) => {
        if (key !== 'parent') {
          if (
            key === 'children' &&
            Array.isArray(node.children) &&
            node.children.length > 0
          ) {
            // Recursively clean children
            cleanNode.children = this.removeCircularReferences(node.children);
          } else {
            // Copy other properties as is
            cleanNode[key] = node[key];
          }
        }
      });

      return cleanNode;
    });
  }
}
