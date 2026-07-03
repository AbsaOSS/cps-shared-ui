import { signal, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseComponent } from 'primeng/basecomponent';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsTreeTableComponent } from './cps-tree-table.component';

const mockFontSize = signal(16);
const mockRootFontSizeService = {
  fontSize: mockFontSize.asReadonly()
};

describe('CpsTreeTableComponent', () => {
  let fixture: ComponentFixture<CpsTreeTableComponent>;
  let component: CpsTreeTableComponent;

  beforeEach(async () => {
    jest
      .spyOn(BaseComponent.prototype, 'ngOnInit')
      .mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [CpsTreeTableComponent, NoopAnimationsModule],
      providers: [
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTreeTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a primengTreeTable ViewChild', () => {
    expect(component.primengTreeTable).toBeTruthy();
  });

  describe('input defaults', () => {
    it('should default striped to true', () =>
      expect(component.striped).toBe(true));
    it('should default bordered to true', () =>
      expect(component.bordered).toBe(true));
    it('should default size to "normal"', () =>
      expect(component.size).toBe('normal'));
    it('should default selectable to false', () =>
      expect(component.selectable).toBe(false));
    it('should default scrollable to true', () =>
      expect(component.scrollable).toBe(true));
    it('should default paginator to false', () =>
      expect(component.paginator).toBe(false));
    it('should default sortable to false', () =>
      expect(component.sortable).toBe(false));
    it('should default hasToolbar to true', () =>
      expect(component.hasToolbar).toBe(true));
    it('should default toolbarSize to "normal"', () =>
      expect(component.toolbarSize).toBe('normal'));
    it('should default emptyMessage to "No data"', () =>
      expect(component.emptyMessage).toBe('No data'));
    it('should default data to empty array', () =>
      expect(component.data).toEqual([]));
    it('should default selectedRows to empty array', () =>
      expect(component.selectedRows).toEqual([]));
    it('should default resizableColumns to false', () =>
      expect(component.resizableColumns).toBe(false));
    it('should default columnResizeMode to "fit"', () =>
      expect(component.columnResizeMode).toBe('fit'));
    it('should default sortMode to "single"', () =>
      expect(component.sortMode).toBe('single'));
  });

  describe('data setter / getter', () => {
    it('should store a deep clone of the array', () => {
      const arr = [{ data: { id: 1 } }, { data: { id: 2 } }];
      component.data = arr;
      expect(component.data).not.toBe(arr);
      expect(
        (arr[0] as { _defaultSortOrder?: number })._defaultSortOrder
      ).toBeUndefined();
    });

    it('should add _defaultSortOrder to each item', () => {
      component.data = [{ data: { id: 1 } }, { data: { id: 2 } }];
      expect(component.data[0]._defaultSortOrder).toBe(0);
      expect(component.data[1]._defaultSortOrder).toBe(1);
    });

    it('should handle empty array', () => {
      component.data = [];
      expect(component.data).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should convert emptyBodyHeight number to px string', () => {
      component.emptyBodyHeight = 200;
      component.ngOnInit();
      expect(component.emptyBodyHeight).toBe('200px');
    });

    it('should convert emptyBodyHeight pixel string unchanged', () => {
      component.emptyBodyHeight = '150px';
      component.ngOnInit();
      expect(component.emptyBodyHeight).toBe('150px');
    });

    it('should disable virtualScroll when scrollable is false', () => {
      component.scrollable = false;
      component.virtualScroll = true;
      component.ngOnInit();
      expect(component.virtualScroll).toBe(false);
    });

    it('should keep virtualScroll when scrollable is true', () => {
      component.scrollable = true;
      component.virtualScroll = true;
      component.ngOnInit();
      expect(component.virtualScroll).toBe(true);
    });

    it('should set showRemoveBtnOnSelect to false when showAdditionalBtnOnSelect is true', () => {
      component.showAdditionalBtnOnSelect = true;
      component.showRemoveBtnOnSelect = true;
      component.ngOnInit();
      expect(component.showRemoveBtnOnSelect).toBe(false);
    });

    it('should not change showRemoveBtnOnSelect when showAdditionalBtnOnSelect is false', () => {
      component.showAdditionalBtnOnSelect = false;
      component.showRemoveBtnOnSelect = true;
      component.ngOnInit();
      expect(component.showRemoveBtnOnSelect).toBe(true);
    });

    it('should set defScrollHeight from scrollHeight', () => {
      component.scrollHeight = '400px';
      component.ngOnInit();
      expect(component.defScrollHeight).toBe('400px');
    });

    describe('paginator initialization', () => {
      it('should set default rowsPerPageOptions when none provided and paginator is true', () => {
        component.paginator = true;
        component.rowsPerPageOptions = [];
        component.ngOnInit();
        expect(component.rowsPerPageOptions).toEqual([5, 10, 25, 50]);
      });

      it('should set rows to first rowsPerPageOption when rows is 0', () => {
        component.paginator = true;
        component.rowsPerPageOptions = [10, 20, 50];
        component.rows = 0;
        component.ngOnInit();
        expect(component.rows).toBe(10);
      });

      it('should keep provided rows when it is in rowsPerPageOptions', () => {
        component.paginator = true;
        component.rowsPerPageOptions = [10, 20, 50];
        component.rows = 20;
        component.ngOnInit();
        expect(component.rows).toBe(20);
      });

      it('should throw when provided rows is not in rowsPerPageOptions', () => {
        component.paginator = true;
        component.rowsPerPageOptions = [10, 20, 50];
        component.rows = 15;
        expect(() => component.ngOnInit()).toThrow(
          'rowsPerPageOptions must include rows'
        );
      });

      it('should build rowOptions from rowsPerPageOptions', () => {
        component.paginator = true;
        component.rowsPerPageOptions = [5, 10];
        component.ngOnInit();
        expect(component.rowOptions).toEqual([
          { label: '5', value: 5 },
          { label: '10', value: 10 }
        ]);
      });
    });

    describe('globalFilterFields auto-detection', () => {
      it('should derive globalFilterFields from data node keys when showGlobalFilter is true and fields are empty', () => {
        component.showGlobalFilter = true;
        component.globalFilterFields = [];
        component.data = [{ data: { name: 'Alice', age: 30 } }];
        component.ngOnInit();
        expect(component.globalFilterFields).toEqual(['name', 'age']);
      });

      it('should not override existing globalFilterFields', () => {
        component.showGlobalFilter = true;
        component.globalFilterFields = ['name'];
        component.data = [{ data: { name: 'Alice', age: 30 } }];
        component.ngOnInit();
        expect(component.globalFilterFields).toEqual(['name']);
      });

      it('should not set globalFilterFields when data is empty', () => {
        component.showGlobalFilter = true;
        component.globalFilterFields = [];
        component.data = [];
        component.ngOnInit();
        expect(component.globalFilterFields).toEqual([]);
      });
    });

    describe('selectedColumns initialization', () => {
      it('should use initialColumns when provided', () => {
        const cols = [{ header: 'Name', field: 'name' }];
        component.initialColumns = cols;
        component.columns = [{ header: 'Age', field: 'age' }];
        component.ngOnInit();
        expect(component.selectedColumns).toEqual(cols);
      });

      it('should fall back to columns when initialColumns is empty', () => {
        const cols = [{ header: 'Age', field: 'age' }];
        component.initialColumns = [];
        component.columns = cols;
        component.ngOnInit();
        expect(component.selectedColumns).toEqual(cols);
      });
    });
  });

  describe('styleClass getter', () => {
    it('should return "cps-tbar-normal p-treetable-striped" by default', () => {
      expect(component.styleClass).toBe('cps-tbar-normal p-treetable-striped');
    });

    it('should include "cps-tbar-small" when toolbarSize is "small"', () => {
      component.toolbarSize = 'small';
      expect(component.styleClass).toContain('cps-tbar-small');
    });

    it('should not include toolbar class when hasToolbar is false', () => {
      component.hasToolbar = false;
      component.striped = false;
      expect(component.styleClass).toBe('');
    });

    it('should include "p-treetable-sm" when size is "small"', () => {
      component.size = 'small';
      expect(component.styleClass).toContain('p-treetable-sm');
    });

    it('should include "p-treetable-lg" when size is "large"', () => {
      component.size = 'large';
      expect(component.styleClass).toContain('p-treetable-lg');
    });

    it('should not include stripe class when striped is false', () => {
      component.striped = false;
      expect(component.styleClass).not.toContain('p-treetable-striped');
    });
  });

  describe('ngOnChanges', () => {
    it('should clear selection when loading becomes true', () => {
      component.selectedRows = [{ data: { id: 1 } }];
      component.loading = true;
      component.ngOnChanges({ loading: new SimpleChange(false, true, false) });
      expect(component.selectedRows).toEqual([]);
    });

    it('should not clear selection when loading is false', () => {
      component.selectedRows = [{ data: { id: 1 } }];
      component.loading = false;
      component.ngOnChanges({ loading: new SimpleChange(true, false, false) });
      expect(component.selectedRows).toEqual([{ data: { id: 1 } }]);
    });

    it('should call clearGlobalFilter when loading and clearGlobalFilterOnLoading are true', () => {
      component.clearGlobalFilterOnLoading = true;
      component.loading = true;
      jest.spyOn(component, 'clearGlobalFilter');
      component.ngOnChanges({ loading: new SimpleChange(false, true, false) });
      expect(component.clearGlobalFilter).toHaveBeenCalled();
    });

    it('should clear selection when data changes', () => {
      const node = { data: { id: 1 } };
      component.selectedRows = [node];
      component.ngOnChanges({
        data: new SimpleChange([], [node], false)
      });
      expect(component.selectedRows).toEqual([]);
    });

    it('should set virtualScrollItemSize from virtualScrollItemHeight when provided', () => {
      component.virtualScrollItemHeight = 48;
      component.ngOnChanges({
        virtualScrollItemHeight: new SimpleChange(0, 48, false)
      });
      expect(component.virtualScrollItemSize).toBe(48);
    });

    it('should rebuild treeTablePassthrough when paginator changes', () => {
      const before = component.treeTablePassthrough;
      component.paginator = true;
      component.ngOnChanges({
        paginator: new SimpleChange(false, true, false)
      });
      expect(component.treeTablePassthrough).not.toBe(before);
    });

    it('should rebuild treeTablePassthrough when totalRecords changes', () => {
      const before = component.treeTablePassthrough;
      component.ngOnChanges({
        totalRecords: new SimpleChange(0, 100, false)
      });
      expect(component.treeTablePassthrough).not.toBe(before);
    });
  });

  describe('clearSelection', () => {
    it('should set selectedRows to empty array', () => {
      component.selectedRows = [{ data: { id: 1 } }, { data: { id: 2 } }];
      component.clearSelection();
      expect(component.selectedRows).toEqual([]);
    });
  });

  describe('onSelectionChanged', () => {
    it('should emit rowsSelected with an array selection', () => {
      jest.spyOn(component.rowsSelected, 'emit');
      const rows = [{ data: { id: 1 } }];
      component.onSelectionChanged(rows);
      expect(component.rowsSelected.emit).toHaveBeenCalledWith(rows);
    });

    it('should wrap non-array selection in an array', () => {
      jest.spyOn(component.rowsSelected, 'emit');
      const row = { data: { id: 1 } };
      component.onSelectionChanged(row);
      expect(component.rowsSelected.emit).toHaveBeenCalledWith([row]);
    });

    it('should emit rowsSelected with null/undefined as-is', () => {
      jest.spyOn(component.rowsSelected, 'emit');
      component.onSelectionChanged(null);
      expect(component.rowsSelected.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('onSortFunction', () => {
    it('should emit customSortFunction with the event', () => {
      jest.spyOn(component.customSortFunction, 'emit');
      const event = {
        data: [],
        field: 'name',
        order: 1
      } as unknown as Parameters<typeof component.onSortFunction>[0];
      component.onSortFunction(event);
      expect(component.customSortFunction.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('onSort', () => {
    it('should emit sorted with the event', () => {
      jest.spyOn(component.sorted, 'emit');
      const event = { field: 'name', order: 1 };
      component.onSort(event);
      expect(component.sorted.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('onFilter', () => {
    it('should emit filtered with the event', () => {
      jest.spyOn(component.filtered, 'emit');
      const event = { filters: {} };
      component.onFilter(event);
      expect(component.filtered.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('onLazyLoaded', () => {
    it('should emit lazyLoaded with the event', () => {
      jest.spyOn(component.lazyLoaded, 'emit');
      const event = { first: 0, rows: 10 };
      component.onLazyLoaded(event);
      expect(component.lazyLoaded.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('onReloadData', () => {
    it('should emit dataReloadBtnClicked when not disabled', () => {
      jest.spyOn(component.dataReloadBtnClicked, 'emit');
      component.dataReloadBtnDisabled = false;
      component.onReloadData();
      expect(component.dataReloadBtnClicked.emit).toHaveBeenCalled();
    });

    it('should not emit when dataReloadBtnDisabled is true', () => {
      jest.spyOn(component.dataReloadBtnClicked, 'emit');
      component.dataReloadBtnDisabled = true;
      component.onReloadData();
      expect(component.dataReloadBtnClicked.emit).not.toHaveBeenCalled();
    });
  });

  describe('removeSelected', () => {
    it('should emit rowsToRemove with selected rows', () => {
      jest.spyOn(component.rowsToRemove, 'emit');
      const row = { data: { id: 1 } };
      component.selectedRows = [row];
      component.removeSelected();
      expect(component.rowsToRemove.emit).toHaveBeenCalledWith([row]);
    });
  });

  describe('onClickActionBtn', () => {
    it('should emit actionBtnClicked', () => {
      jest.spyOn(component.actionBtnClicked, 'emit');
      component.onClickActionBtn();
      expect(component.actionBtnClicked.emit).toHaveBeenCalled();
    });
  });

  describe('onClickAdditionalBtnOnSelect', () => {
    it('should emit additionalBtnOnSelectClicked with selected rows', () => {
      jest.spyOn(component.additionalBtnOnSelectClicked, 'emit');
      component.selectedRows = [{ data: { id: 1 } }];
      component.onClickAdditionalBtnOnSelect();
      expect(component.additionalBtnOnSelectClicked.emit).toHaveBeenCalledWith([
        { data: { id: 1 } }
      ]);
    });
  });

  describe('onEditRowClicked', () => {
    it('should emit editRowBtnClicked with the node', () => {
      jest.spyOn(component.editRowBtnClicked, 'emit');
      const node = { data: { id: 2 } };
      component.onEditRowClicked(node);
      expect(component.editRowBtnClicked.emit).toHaveBeenCalledWith(node);
    });
  });

  describe('onRemoveRowClicked', () => {
    it('should emit rowsToRemove with the node wrapped in an array', () => {
      jest.spyOn(component.rowsToRemove, 'emit');
      const node = { data: { id: 5 } };
      component.onRemoveRowClicked(node);
      expect(component.rowsToRemove.emit).toHaveBeenCalledWith([node]);
    });
  });

  describe('onSelectedColumnsChange', () => {
    it('should update selectedColumns', () => {
      const cols = [{ header: 'Name', field: 'name' }];
      component.onSelectedColumnsChange(cols);
      expect(component.selectedColumns).toEqual(cols);
    });

    it('should emit columnsSelected', () => {
      jest.spyOn(component.columnsSelected, 'emit');
      const cols = [{ header: 'Age', field: 'age' }];
      component.onSelectedColumnsChange(cols);
      expect(component.columnsSelected.emit).toHaveBeenCalledWith(cols);
    });
  });

  describe('node events', () => {
    it('onNodeExpanded should emit nodeExpanded with the event', () => {
      jest.spyOn(component.nodeExpanded, 'emit');
      const event = { node: { data: { id: 1 } } };
      component.onNodeExpanded(event);
      expect(component.nodeExpanded.emit).toHaveBeenCalledWith(event);
    });

    it('onNodeCollapsed should emit nodeCollapsed with the event', () => {
      jest.spyOn(component.nodeCollapsed, 'emit');
      const event = { node: { data: { id: 2 } } };
      component.onNodeCollapsed(event);
      expect(component.nodeCollapsed.emit).toHaveBeenCalledWith(event);
    });

    it('onNodeSelected should emit nodeSelected with the event', () => {
      jest.spyOn(component.nodeSelected, 'emit');
      const event = { node: { data: { id: 3 } } };
      component.onNodeSelected(event);
      expect(component.nodeSelected.emit).toHaveBeenCalledWith(event);
    });

    it('onNodeUnselected should emit nodeUnselected with the event', () => {
      jest.spyOn(component.nodeUnselected, 'emit');
      const event = { node: { data: { id: 4 } } };
      component.onNodeUnselected(event);
      expect(component.nodeUnselected.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('onFilterGlobal', () => {
    it('should call primengTreeTable.filterGlobal with value and "contains"', () => {
      jest
        .spyOn(component.primengTreeTable, 'filterGlobal')
        .mockImplementation(() => {});
      component.onFilterGlobal('search term');
      expect(component.primengTreeTable.filterGlobal).toHaveBeenCalledWith(
        'search term',
        'contains'
      );
    });
  });

  describe('pagination helpers', () => {
    beforeEach(() => {
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
    });

    it('getPageCount should return total pages', () => {
      expect(component.getPageCount()).toBe(3);
    });

    it('getPage should return 0 when primengTreeTable.first is 0', () => {
      component.primengTreeTable.first = 0;
      expect(component.getPage()).toBe(0);
    });

    it('getPage should return correct page from primengTreeTable.first', () => {
      component.primengTreeTable.first = 20;
      expect(component.getPage()).toBe(2);
    });

    it('changePage should call primengTreeTable.onPageChange for valid page', () => {
      jest
        .spyOn(component.primengTreeTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(1);
      expect(component.primengTreeTable.onPageChange).toHaveBeenCalledWith({
        first: 10,
        rows: 10
      });
    });

    it('changePage should ignore out-of-bounds page', () => {
      jest
        .spyOn(component.primengTreeTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(5);
      expect(component.primengTreeTable.onPageChange).not.toHaveBeenCalled();
    });

    it('changePage should ignore negative page', () => {
      jest
        .spyOn(component.primengTreeTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(-1);
      expect(component.primengTreeTable.onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update first and rows', () => {
      component.rows = 10;
      component.primengTreeTable.totalRecords = 50;
      jest
        .spyOn(component.primengTreeTable, 'onPageChange')
        .mockImplementation(() => {});
      component.onPageChange({ first: 10, rows: 10 });
      expect(component.first).toBe(10);
      expect(component.rows).toBe(10);
    });

    it('should emit pageChanged with page state', () => {
      jest.spyOn(component.pageChanged, 'emit');
      jest
        .spyOn(component.primengTreeTable, 'onPageChange')
        .mockImplementation(() => {});
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
      component.primengTreeTable.first = 10;
      component.onPageChange({ first: 10, rows: 10 });
      expect(component.pageChanged.emit).toHaveBeenCalledWith({
        page: 1,
        first: 10,
        rows: 10,
        pageCount: 3
      });
    });
  });

  describe('getExportData', () => {
    it('should return exportOriginalData when it is set', () => {
      const orig = [{ id: 1 }, { id: 2 }];
      component.exportOriginalData = orig;
      expect(component.getExportData()).toBe(orig);
    });

    it('should return primengTreeTable.value without parent references when exportOriginalData is empty', () => {
      component.exportOriginalData = [];
      const parent = { data: { id: 1 } };
      const child = { data: { id: 2 }, parent };
      component.primengTreeTable.value = [
        { data: { id: 1 }, children: [child] }
      ];
      const result = component.getExportData();
      expect(result[0].children[0].data).toEqual({ id: 2 });
      expect(result[0].children[0].parent).toBeUndefined();
    });

    it('should remove parent key from top-level nodes', () => {
      component.exportOriginalData = [];
      component.primengTreeTable.value = [
        { data: { id: 1 }, parent: { data: { id: 0 } } }
      ];
      const result = component.getExportData();
      expect(result[0].parent).toBeUndefined();
      expect(result[0].data).toEqual({ id: 1 });
    });

    it('should return empty array when primengTreeTable.value is empty', () => {
      component.exportOriginalData = [];
      component.primengTreeTable.value = [];
      expect(component.getExportData()).toEqual([]);
    });
  });

  describe('exportJSON', () => {
    it('should create a download link and trigger download', () => {
      (URL as unknown as { createObjectURL: jest.Mock }).createObjectURL = jest
        .fn()
        .mockReturnValue('blob:mock-url');
      const mockClick = jest.fn();
      const mockAnchor = { href: '', download: '', click: mockClick };
      const origCreate = document.createElement.bind(document);
      jest
        .spyOn(document, 'createElement')
        .mockImplementation((tag: string) =>
          tag === 'a' ? (mockAnchor as unknown as HTMLElement) : origCreate(tag)
        );

      component.exportOriginalData = [{ id: 1 }];
      component.exportFilename = 'my-export';
      component.exportJSON();

      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('my-export.json');
    });

    it('should not throw on error (catches internally)', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (URL as unknown as { createObjectURL: jest.Mock }).createObjectURL = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('mock error');
        });
      expect(() => component.exportJSON()).not.toThrow();
    });
  });

  describe('treeTablePassthrough', () => {
    it('should return empty object when paginator is false', () => {
      component.paginator = false;
      component.ngOnInit();
      expect(component.treeTablePassthrough).toEqual({});
    });

    it('should set first button aria-disabled to true when first is 0', () => {
      component.paginator = true;
      component.rowsPerPageOptions = [10];
      component.first = 0;
      component.data = [{ data: { id: 1 } }];
      component.ngOnInit();
      const pt = component.treeTablePassthrough as unknown as {
        pcPaginator?: { first?: { 'aria-disabled'?: string | null } };
      };
      expect(pt.pcPaginator?.first?.['aria-disabled']).toBe('true');
    });

    it('should set first button aria-disabled to null when first > 0', () => {
      component.paginator = true;
      component.rowsPerPageOptions = [10];
      component.rows = 10;
      component.first = 10;
      component.data = [{ data: { id: 1 } }, { data: { id: 2 } }];
      component.ngOnInit();
      const pt = component.treeTablePassthrough as unknown as {
        pcPaginator?: { first?: { 'aria-disabled'?: string | null } };
      };
      expect(pt.pcPaginator?.first?.['aria-disabled']).toBeNull();
    });
  });

  describe('onPaginatorKeydown', () => {
    it('should do nothing for non-arrow keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');
      component.onPaginatorKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should do nothing when target does not have p-paginator-page class', () => {
      const btn = document.createElement('button');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: btn });
      jest.spyOn(event, 'preventDefault');
      component.onPaginatorKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should call preventDefault when target is a paginator page button', () => {
      const btn = document.createElement('button');
      btn.classList.add('p-paginator-page');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: btn });
      jest.spyOn(event, 'preventDefault');
      component.onPaginatorKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
