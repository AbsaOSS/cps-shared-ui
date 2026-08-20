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

  function itSchedulesRecalcAsMicrotask(
    label: string,
    invoke: () => void,
    recalcMethodName: string,
    expectedArgs: unknown[]
  ) {
    it(`${label} defers to the recalculation after change detection`, async () => {
      const recalcSpy = jest
        .spyOn(component as any, recalcMethodName)
        .mockImplementation(() => {});

      invoke();
      await Promise.resolve();

      expect(recalcSpy).toHaveBeenCalledWith(...expectedArgs);
    });

    it(`${label} runs detectChanges() before the recalculation, in that order`, async () => {
      const callOrder: string[] = [];
      jest
        .spyOn((component as any).cdRef, 'detectChanges')
        .mockImplementation(() => {
          callOrder.push('detectChanges');
        });
      jest.spyOn(component as any, recalcMethodName).mockImplementation(() => {
        callOrder.push('recalc');
      });

      invoke();
      expect(callOrder).toEqual([]);

      await Promise.resolve();
      expect(callOrder).toEqual(['detectChanges', 'recalc']);
    });

    it(`${label} schedules the recalculation as a real microtask, not a macrotask`, async () => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
      try {
        jest
          .spyOn((component as any).cdRef, 'detectChanges')
          .mockImplementation(() => {});
        const recalcSpy = jest
          .spyOn(component as any, recalcMethodName)
          .mockImplementation(() => {});

        invoke();
        await Promise.resolve();

        expect(recalcSpy).toHaveBeenCalledWith(...expectedArgs);
      } finally {
        jest.useRealTimers();
      }
    });
  }

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
    it('should default loadingLabel to "Loading..."', () =>
      expect(component.loadingLabel).toBe('Loading...'));
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

    itSchedulesRecalcAsMicrotask(
      'onSort',
      () => component.onSort({ field: 'name', order: 1 }),
      '_calcAutoLayoutHeaderWidths',
      []
    );
  });

  describe('onFilter', () => {
    it('should emit filtered with the event', () => {
      jest.spyOn(component.filtered, 'emit');
      const event = { filters: {} };
      component.onFilter(event);
      expect(component.filtered.emit).toHaveBeenCalledWith(event);
    });

    itSchedulesRecalcAsMicrotask(
      'onFilter',
      () => component.onFilter({ filters: {} }),
      '_calcAutoLayoutHeaderWidths',
      []
    );
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

    it('should recalc auto layout header widths asynchronously', async () => {
      const recalcSpy = jest
        .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
        .mockImplementation(() => {});
      component.onSelectedColumnsChange([]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(recalcSpy).toHaveBeenCalled();
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

  describe('auto layout column widths (incremental expand/collapse)', () => {
    let originalOffsetWidth: PropertyDescriptor | undefined;
    let originalOffsetParent: PropertyDescriptor | undefined;

    beforeAll(() => {
      originalOffsetWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetWidth'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get(this: HTMLElement) {
          return Number(this.getAttribute('data-test-width') || 0);
        }
      });

      // jsdom never lays out elements, so offsetParent is always null,
      // which would make every element look "hidden". Simulate a visible
      // element by default, matching what these tests exercise.
      originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetParent'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get(): HTMLElement {
          return document.body;
        }
      });
    });

    afterAll(() => {
      if (originalOffsetWidth) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          originalOffsetWidth
        );
      }
      if (originalOffsetParent) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetParent',
          originalOffsetParent
        );
      }
    });

    function makeCell(
      tag: 'th' | 'td',
      width: number,
      extraClass?: string
    ): HTMLElement {
      const el = document.createElement(tag);
      el.setAttribute('data-test-width', String(width));
      if (extraClass) el.classList.add(extraClass);
      return el;
    }

    function makeHeaderBox(cells: HTMLElement[]): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<table><thead><tr></tr></thead></table>';
      const tr = wrapper.querySelector('tr') as HTMLElement;
      cells.forEach((c) => tr.appendChild(c));
      return wrapper;
    }

    function makeScrollableBody(rows: HTMLElement[][]): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<table><tbody></tbody></table>';
      const tbody = wrapper.querySelector('tbody') as HTMLElement;
      rows.forEach((cells) => {
        const tr = document.createElement('tr');
        cells.forEach((c) => tr.appendChild(c));
        tbody.appendChild(tr);
      });
      return wrapper;
    }

    function setupBasicTable() {
      component.autoLayout = true;
      component.scrollable = true;
      component.virtualScroll = false;

      const th1 = makeCell('th', 100);
      const th2 = makeCell('th', 50);
      (component as any)._headerBox = makeHeaderBox([th1, th2]);

      const nodeA: any = { data: { id: 'a' } };
      const nodeB: any = { data: { id: 'b' } };
      const rowA = [makeCell('td', 80), makeCell('td', 40)];
      const rowB = [makeCell('td', 120), makeCell('td', 60)];
      (component as any)._scrollableBody = makeScrollableBody([rowA, rowB]);
      component.primengTreeTable.serializedValue = [
        { node: nodeA, visible: true },
        { node: nodeB, visible: true }
      ] as any;

      (component as any)._calcAutoLayoutHeaderWidths();

      return { th1, th2, nodeA, nodeB, rowA, rowB };
    }

    describe('_calcAutoLayoutHeaderWidths (full recalc)', () => {
      it('populates the per-row cache keyed by tree node and applies percentages', () => {
        const { th1, th2, nodeA, nodeB } = setupBasicTable();

        expect((component as any)._visibleRowWidthsPxByNode.get(nodeA)).toEqual(
          [80, 40]
        );
        expect((component as any)._visibleRowWidthsPxByNode.get(nodeB)).toEqual(
          [120, 60]
        );
        expect((component as any)._headerWidthsPx).toEqual([100, 50]);

        expect(th1.style.width).toBe(`${(120 / 180) * 100}%`);
        expect(th2.style.width).toBe(`${(60 / 180) * 100}%`);
      });

      it('never leaves more than one offscreen shadow-measurement structure attached, across repeated recalcs', () => {
        setupBasicTable();
        expect(
          fixture.nativeElement.querySelectorAll(
            '.cps-treetable-shadow-measure'
          ).length
        ).toBe(0);

        (component as any)._calcAutoLayoutHeaderWidths();
        (component as any)._calcAutoLayoutHeaderWidths();

        expect(
          fixture.nativeElement.querySelectorAll(
            '.cps-treetable-shadow-measure'
          ).length
        ).toBe(0);
      });

      it('removes the shadow-measurement wrapper even if measurement throws partway through', () => {
        setupBasicTable();

        const cloneNodeSpy = jest
          .spyOn(HTMLElement.prototype, 'cloneNode')
          .mockImplementationOnce(() => {
            throw new Error('boom');
          });

        expect(() => (component as any)._calcAutoLayoutHeaderWidths()).toThrow(
          'boom'
        );

        expect(
          fixture.nativeElement.querySelectorAll(
            '.cps-treetable-shadow-measure'
          ).length
        ).toBe(0);

        cloneNodeSpy.mockRestore();
      });

      it('clears stale cache entries for nodes no longer present', () => {
        const { nodeA } = setupBasicTable();
        expect((component as any)._visibleRowWidthsPxByNode.has(nodeA)).toBe(
          true
        );

        const nodeC: any = { data: { id: 'c' } };
        const rowC = [makeCell('td', 90), makeCell('td', 45)];
        (component as any)._scrollableBody = makeScrollableBody([rowC]);
        component.primengTreeTable.serializedValue = [
          { node: nodeC, visible: true }
        ] as any;

        (component as any)._calcAutoLayoutHeaderWidths();

        expect((component as any)._visibleRowWidthsPxByNode.has(nodeA)).toBe(
          false
        );
        expect((component as any)._visibleRowWidthsPxByNode.get(nodeC)).toEqual(
          [90, 45]
        );
      });

      it('does not resize a row whose cell count does not match the header (e.g. an empty-message row)', () => {
        const th0 = makeCell('th', 100, 'cps-treetable-selectable-cell');
        const th1 = makeCell('th', 100);
        const th2 = makeCell('th', 50);
        (component as any)._headerBox = makeHeaderBox([th0, th1, th2]);

        const nodeA: any = { data: { id: 'a' } };
        const rowA = [
          makeCell('td', 20, 'cps-treetable-selectable-cell'),
          makeCell('td', 80),
          makeCell('td', 40)
        ];

        const emptyMessageCell = makeCell('td', 999);
        const emptyMessageRow = document.createElement('tr');
        emptyMessageRow.appendChild(emptyMessageCell);

        (component as any)._scrollableBody = makeScrollableBody([rowA]);
        (component as any)._scrollableBody
          .querySelector('tbody')
          .appendChild(emptyMessageRow);

        component.primengTreeTable.serializedValue = [
          { node: nodeA, visible: true }
        ] as any;

        (component as any)._calcAutoLayoutHeaderWidths();

        expect(emptyMessageCell.style.width).toBe('');
        expect(rowA[0].style.width).toBe('3.4375rem');
      });

      it('schedules a retry (via requestAnimationFrame, not an immediate re-check) when there are no header cells', () => {
        setupBasicTable();
        (component as any)._needRecalcAutoLayout = false;
        (component as any)._headerBox = makeHeaderBox([]);

        (component as any)._calcAutoLayoutHeaderWidths();

        // Deferred to the next real frame rather than re-armed immediately —
        // an immediate re-arm here would let ngAfterViewChecked retry on
        // every single change-detection tick, hammering layout reads.
        expect((component as any)._needRecalcAutoLayout).toBe(false);
        expect((component as any)._pendingRecalcRafId).not.toBeNull();
      });

      it('schedules a retry (via requestAnimationFrame, not an immediate re-check) when header cells all have zero width', () => {
        setupBasicTable();
        (component as any)._needRecalcAutoLayout = false;
        (component as any)._headerBox = makeHeaderBox([
          makeCell('th', 0),
          makeCell('th', 0)
        ]);

        (component as any)._calcAutoLayoutHeaderWidths();

        expect((component as any)._needRecalcAutoLayout).toBe(false);
        expect((component as any)._pendingRecalcRafId).not.toBeNull();
      });

      it('schedules a retry (via requestAnimationFrame, not an immediate re-check) when there are no body rows yet', () => {
        setupBasicTable();
        (component as any)._needRecalcAutoLayout = false;
        (component as any)._scrollableBody = makeScrollableBody([]);

        (component as any)._calcAutoLayoutHeaderWidths();

        expect((component as any)._needRecalcAutoLayout).toBe(false);
        expect((component as any)._pendingRecalcRafId).not.toBeNull();
      });

      it('re-runs the recalculation when the scheduled retry frame fires', async () => {
        setupBasicTable();
        (component as any)._needRecalcAutoLayout = false;
        (component as any)._headerBox = makeHeaderBox([]);

        const calcSpy = jest.spyOn(
          component as any,
          '_calcAutoLayoutHeaderWidths'
        );

        (component as any)._calcAutoLayoutHeaderWidths();
        expect((component as any)._pendingRecalcRafId).not.toBeNull();
        calcSpy.mockClear();

        // Let the real (jsdom) scheduled frame actually fire rather than
        // mocking requestAnimationFrame — zone.js's patching means a bare
        // rAF call made from inside runOutsideAngular doesn't reliably
        // route through a window.requestAnimationFrame spy.
        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        expect(calcSpy).toHaveBeenCalledWith();
        // The header box is still empty, so this retry attempt fails the
        // same way and schedules another one — that's the correct, expected
        // behavior, not a bug: _pendingRecalcRafId should be non-null again.
        expect((component as any)._needRecalcAutoLayout).toBe(false);
        expect((component as any)._pendingRecalcRafId).not.toBeNull();
      });

      it('cancels a pending auto-layout retry frame on destroy, so the callback never touches the destroyed component', async () => {
        setupBasicTable();
        (component as any)._needRecalcAutoLayout = false;
        (component as any)._headerBox = makeHeaderBox([]);

        (component as any)._calcAutoLayoutHeaderWidths();
        expect((component as any)._pendingRecalcRafId).not.toBeNull();

        component.ngOnDestroy();
        expect((component as any)._pendingRecalcRafId).toBeNull();

        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        // If the frame had not actually been cancelled, its callback would
        // have retried and scheduled a new pending frame by now.
        expect((component as any)._pendingRecalcRafId).toBeNull();
      });

      it('leaves _needRecalcAutoLayout false after a successful recalc', () => {
        setupBasicTable();
        expect((component as any)._needRecalcAutoLayout).toBe(false);
      });

      it('skips recalculation and does not schedule a retry when the element is hidden (offsetParent === null)', () => {
        setupBasicTable();
        Object.defineProperty(
          (component as any)._elementRef.nativeElement,
          'offsetParent',
          { configurable: true, get: () => null }
        );
        (component as any)._needRecalcAutoLayout = true;
        const pendingRafIdBefore = (component as any)._pendingRecalcRafId;
        const queryHeaderCellsSpy = jest.spyOn(
          component as any,
          '_queryHeaderCells'
        );

        (component as any)._calcAutoLayoutHeaderWidths();

        expect(queryHeaderCellsSpy).not.toHaveBeenCalled();
        expect((component as any)._needRecalcAutoLayout).toBe(false);
        expect((component as any)._pendingRecalcRafId).toBe(pendingRafIdBefore);
      });
    });

    describe('ngAfterViewChecked (hidden-element guard)', () => {
      it('does nothing when the element is hidden (offsetParent === null), leaving auto-layout state untouched', () => {
        setupBasicTable();
        Object.defineProperty(
          (component as any)._elementRef.nativeElement,
          'offsetParent',
          { configurable: true, get: () => null }
        );
        (component as any)._needRecalcAutoLayout = true;
        const calcSpy = jest.spyOn(
          component as any,
          '_calcAutoLayoutHeaderWidths'
        );

        component.ngAfterViewChecked();

        expect(calcSpy).not.toHaveBeenCalled();
        expect((component as any)._needRecalcAutoLayout).toBe(true);
      });
    });

    describe('_requestRecalc (shared by the scroll listener, ResizeObserver, and the auto-layout retry)', () => {
      it('coalesces repeated calls within the same frame into a single scheduled frame and a single recalc', async () => {
        setupBasicTable();
        const calcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._requestRecalc();
        const firstId = (component as any)._pendingRecalcRafId;
        expect(firstId).not.toBeNull();

        // A second call arriving before the frame fires (mirroring a second
        // 'scroll' or resize event landing in the same frame) must not
        // schedule a second frame.
        (component as any)._requestRecalc();
        expect((component as any)._pendingRecalcRafId).toBe(firstId);

        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        expect(calcSpy).toHaveBeenCalledTimes(1);
        expect(calcSpy).toHaveBeenCalledWith();
        expect((component as any)._pendingRecalcRafId).toBeNull();
      });

      it('cancels a pending coalesced frame on destroy, regardless of which trigger scheduled it', async () => {
        setupBasicTable();
        const calcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._requestRecalc();
        expect((component as any)._pendingRecalcRafId).not.toBeNull();

        component.ngOnDestroy();
        expect((component as any)._pendingRecalcRafId).toBeNull();

        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        expect(calcSpy).not.toHaveBeenCalled();
      });
    });

    describe('resize-pinned columns', () => {
      function setupThreeColumnTable() {
        component.autoLayout = true;
        component.scrollable = true;
        component.virtualScroll = false;

        const th0 = makeCell('th', 100);
        const th1 = makeCell('th', 50);
        const th2 = makeCell('th', 80);
        (component as any)._headerBox = makeHeaderBox([th0, th1, th2]);

        const nodeA: any = { data: { id: 'a' } };
        const rowA = [
          makeCell('td', 100),
          makeCell('td', 50),
          makeCell('td', 80)
        ];
        (component as any)._scrollableBody = makeScrollableBody([rowA]);
        component.primengTreeTable.serializedValue = [
          { node: nodeA, visible: true }
        ] as any;

        (component as any)._calcAutoLayoutHeaderWidths();

        return { th0, th1, th2, nodeA, rowA };
      }

      it('onColumnResized pins the resized column by index', () => {
        const { th1 } = setupThreeColumnTable();
        th1.setAttribute('data-test-width', '150');

        (component as any).onColumnResized({ element: th1, delta: 100 });

        expect((component as any)._pinnedColumnWidthsPx.get(1)).toBe(150);
      });

      it('ignores resize events on selectable-checkbox/row-menu columns', () => {
        setupThreeColumnTable();
        const th = makeCell('th', 50, 'cps-treetable-selectable-cell');

        (component as any).onColumnResized({ element: th, delta: 10 });

        expect((component as any)._pinnedColumnWidthsPx.size).toBe(0);
      });

      it('excludes the pinned column from the percentage sum and keeps it at its exact px width', () => {
        const { th0, th1, th2 } = setupThreeColumnTable();

        (component as any)._pinnedColumnWidthsPx.set(1, 150);
        (component as any)._calcAutoLayoutHeaderWidths();

        expect(th1.style.width).toBe('150px');
        expect(th0.style.width).toBe(`${(100 / 180) * 100}%`);
        expect(th2.style.width).toBe(`${(80 / 180) * 100}%`);
      });

      it('applies the same fixed width to header and body for a pinned column', () => {
        const { rowA } = setupThreeColumnTable();
        (component as any)._pinnedColumnWidthsPx.set(1, 150);

        (component as any)._calcAutoLayoutHeaderWidths();

        expect(rowA[1].style.width).toBe('150px');
      });

      it('clears pinned columns when the header cell count changes', () => {
        setupThreeColumnTable();
        (component as any)._pinnedColumnWidthsPx.set(1, 150);

        const newTh0 = makeCell('th', 100);
        const newTh1 = makeCell('th', 50);
        (component as any)._headerBox = makeHeaderBox([newTh0, newTh1]);
        const nodeX: any = { data: { id: 'x' } };
        const rowX = [makeCell('td', 100), makeCell('td', 50)];
        (component as any)._scrollableBody = makeScrollableBody([rowX]);
        component.primengTreeTable.serializedValue = [
          { node: nodeX, visible: true }
        ] as any;

        (component as any)._calcAutoLayoutHeaderWidths();

        expect((component as any)._pinnedColumnWidthsPx.size).toBe(0);
      });

      it('keeps a pinned column at its exact width even when new content would otherwise grow it', () => {
        const { nodeA, th1 } = setupThreeColumnTable();
        (component as any)._pinnedColumnWidthsPx.set(1, 150);

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];

        const newTr = document.createElement('tr');
        [makeCell('td', 10), makeCell('td', 300), makeCell('td', 10)].forEach(
          (c) => newTr.appendChild(c)
        );
        const rowATr = (component as any)._scrollableBody.querySelectorAll(
          'tr'
        )[0];
        rowATr.parentElement.insertBefore(newTr, rowATr.nextSibling);

        component.primengTreeTable.serializedValue = [
          { node: nodeA, visible: true },
          { node: nodeAChild, visible: true }
        ] as any;

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(th1.style.width).toBe('150px');
        expect(newTr.querySelectorAll('td')[1].style.width).toBe('150px');
      });
    });

    describe('_expandAutoLayoutIncremental', () => {
      function setSerializedValue(entries: { node: any; visible: boolean }[]) {
        component.primengTreeTable.serializedValue = entries as any;
      }

      it('measures only the newly-revealed rows and adds them to the cache', () => {
        const { nodeA, nodeB } = setupBasicTable();
        const measureSpy = jest.spyOn(component as any, '_measureRowsWidthsPx');

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];

        const newTr = document.createElement('tr');
        [makeCell('td', 55), makeCell('td', 20)].forEach((c) =>
          newTr.appendChild(c)
        );
        const rowATr = (component as any)._scrollableBody.querySelectorAll(
          'tr'
        )[0];
        rowATr.parentElement.insertBefore(newTr, rowATr.nextSibling);

        setSerializedValue([
          { node: nodeA, visible: true },
          { node: nodeAChild, visible: true },
          { node: nodeB, visible: true }
        ]);

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(
          (component as any)._visibleRowWidthsPxByNode.get(nodeAChild)
        ).toEqual([55, 20]);
        expect(measureSpy).toHaveBeenCalledWith(
          null,
          [newTr],
          expect.any(Function)
        );
      });

      it('restyles every currently-visible row, not just the new ones, even when nothing grew', () => {
        const { nodeA, nodeB } = setupBasicTable();
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];

        const newTr = document.createElement('tr');
        [makeCell('td', 10), makeCell('td', 5)].forEach((c) =>
          newTr.appendChild(c)
        );
        const rowATr = (component as any)._scrollableBody.querySelectorAll(
          'tr'
        )[0];
        rowATr.parentElement.insertBefore(newTr, rowATr.nextSibling);

        setSerializedValue([
          { node: nodeA, visible: true },
          { node: nodeAChild, visible: true },
          { node: nodeB, visible: true }
        ]);

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(applySpy).toHaveBeenCalledTimes(1);
        const allRows = (component as any)._queryBodyRows();
        expect(applySpy.mock.calls[0][1]).toEqual(allRows);
        expect(allRows).toContain(newTr);
      });

      it('restyles headers and all visible rows when a column grows', () => {
        const { nodeA, nodeB } = setupBasicTable();
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];

        const newTr = document.createElement('tr');
        [makeCell('td', 500), makeCell('td', 5)].forEach((c) =>
          newTr.appendChild(c)
        );
        const rowATr = (component as any)._scrollableBody.querySelectorAll(
          'tr'
        )[0];
        rowATr.parentElement.insertBefore(newTr, rowATr.nextSibling);

        setSerializedValue([
          { node: nodeA, visible: true },
          { node: nodeAChild, visible: true },
          { node: nodeB, visible: true }
        ]);

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(applySpy).toHaveBeenCalledTimes(1);
        const allRows = (component as any)._queryBodyRows();
        expect(applySpy.mock.calls[0][1]).toEqual(allRows);
      });

      it('recurses into already-expanded children to find every newly-visible node', () => {
        const { nodeA, nodeB } = setupBasicTable();

        const grandchild: any = { data: { id: 'grandchild' } };
        const child: any = {
          data: { id: 'child' },
          expanded: true,
          children: [grandchild]
        };
        nodeA.children = [child];

        const childRow = document.createElement('tr');
        [makeCell('td', 10), makeCell('td', 5)].forEach((c) =>
          childRow.appendChild(c)
        );
        const grandchildRow = document.createElement('tr');
        [makeCell('td', 15), makeCell('td', 6)].forEach((c) =>
          grandchildRow.appendChild(c)
        );

        const rowATr = (component as any)._scrollableBody.querySelectorAll(
          'tr'
        )[0];
        rowATr.parentElement.insertBefore(grandchildRow, rowATr.nextSibling);
        rowATr.parentElement.insertBefore(childRow, rowATr.nextSibling);

        setSerializedValue([
          { node: nodeA, visible: true },
          { node: child, visible: true },
          { node: grandchild, visible: true },
          { node: nodeB, visible: true }
        ]);

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect((component as any)._visibleRowWidthsPxByNode.get(child)).toEqual(
          [10, 5]
        );
        expect(
          (component as any)._visibleRowWidthsPxByNode.get(grandchild)
        ).toEqual([15, 6]);
      });

      it('never measures when the node has no children, but still reapplies cached widths to every visible row', () => {
        const { nodeA } = setupBasicTable();
        const measureSpy = jest.spyOn(component as any, '_measureRowsWidthsPx');
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');
        const fullRecalcSpy = jest.spyOn(
          component as any,
          '_calcAutoLayoutHeaderWidths'
        );

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(measureSpy).not.toHaveBeenCalled();
        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(fullRecalcSpy).not.toHaveBeenCalled();
      });

      it('falls back to a full recalc when virtualScroll is true', () => {
        const { nodeA } = setupBasicTable();
        nodeA.children = [{ data: { id: 'a-child' } }];
        component.virtualScroll = true;

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when no cache exists yet', () => {
        const { nodeA } = setupBasicTable();
        nodeA.children = [{ data: { id: 'a-child' } }];
        (component as any)._headerWidthsPx = null;

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when event.node is missing', () => {
        setupBasicTable();

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._expandAutoLayoutIncremental({});

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when the toggled node cannot be located in serializedValue', () => {
        const { nodeA } = setupBasicTable();
        nodeA.children = [{ data: { id: 'a-child' } }];

        setSerializedValue([]);

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when fewer sibling rows exist than expected', () => {
        const { nodeA, nodeB } = setupBasicTable();
        const child1: any = { data: { id: 'child-1' } };
        const child2: any = { data: { id: 'child-2' } };
        nodeA.children = [child1, child2];

        setSerializedValue([
          { node: nodeA, visible: true },
          { node: child1, visible: true },
          { node: child2, visible: true },
          { node: nodeB, visible: true }
        ]);

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._expandAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });
    });

    describe('_collapseAutoLayoutIncremental', () => {
      it('deletes the collapsed subtree from the cache without measuring anything', () => {
        const { nodeA, nodeB } = setupBasicTable();
        const measureSpy = jest.spyOn(component as any, '_measureRowsWidthsPx');

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];
        (component as any)._visibleRowWidthsPxByNode.set(nodeAChild, [10, 5]);

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect(
          (component as any)._visibleRowWidthsPxByNode.has(nodeAChild)
        ).toBe(false);
        expect((component as any)._visibleRowWidthsPxByNode.has(nodeB)).toBe(
          true
        );
        expect(measureSpy).not.toHaveBeenCalled();
      });

      it('still reapplies to every visible row even when the collapsed subtree was not driving any column width', () => {
        const { nodeA } = setupBasicTable();
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');
        const measureSpy = jest.spyOn(component as any, '_measureRowsWidthsPx');

        const nodeAChild: any = { data: { id: 'a-child' } };
        nodeA.children = [nodeAChild];
        (component as any)._visibleRowWidthsPxByNode.set(nodeAChild, [10, 5]);

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(measureSpy).not.toHaveBeenCalled();
      });

      it('recomputes and reapplies from the remaining cache when a column shrinks', () => {
        const { nodeB } = setupBasicTable();
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');
        const measureSpy = jest.spyOn(component as any, '_measureRowsWidthsPx');

        const parent: any = { data: { id: 'parent' }, children: [nodeB] };

        (component as any)._collapseAutoLayoutIncremental({ node: parent });

        expect((component as any)._visibleRowWidthsPxByNode.has(nodeB)).toBe(
          false
        );
        expect(measureSpy).not.toHaveBeenCalled();
        expect(applySpy).toHaveBeenCalledTimes(1);
      });

      it('recurses into already-expanded children to find every newly-invisible node', () => {
        const { nodeA } = setupBasicTable();

        const grandchild: any = { data: { id: 'grandchild' } };
        const child: any = {
          data: { id: 'child' },
          expanded: true,
          children: [grandchild]
        };
        nodeA.children = [child];
        (component as any)._visibleRowWidthsPxByNode.set(child, [10, 5]);
        (component as any)._visibleRowWidthsPxByNode.set(grandchild, [15, 6]);

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect((component as any)._visibleRowWidthsPxByNode.has(child)).toBe(
          false
        );
        expect(
          (component as any)._visibleRowWidthsPxByNode.has(grandchild)
        ).toBe(false);
      });

      it('reapplies cached widths without falling back when the node has no children', () => {
        const { nodeA } = setupBasicTable();
        const applySpy = jest.spyOn(component as any, '_applyColumnWidths');
        const fullRecalcSpy = jest.spyOn(
          component as any,
          '_calcAutoLayoutHeaderWidths'
        );

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect(applySpy).toHaveBeenCalledTimes(1);
        expect(fullRecalcSpy).not.toHaveBeenCalled();
      });

      it('falls back to a full recalc when virtualScroll is true', () => {
        const { nodeA } = setupBasicTable();
        nodeA.children = [{ data: { id: 'a-child' } }];
        component.virtualScroll = true;

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when no cache exists yet', () => {
        const { nodeA } = setupBasicTable();
        nodeA.children = [{ data: { id: 'a-child' } }];
        (component as any)._headerWidthsPx = null;

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._collapseAutoLayoutIncremental({ node: nodeA });

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });

      it('falls back to a full recalc when event.node is missing', () => {
        setupBasicTable();

        const fullRecalcSpy = jest
          .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
          .mockImplementation(() => {});

        (component as any)._collapseAutoLayoutIncremental({});

        expect(fullRecalcSpy).toHaveBeenCalledWith();
      });
    });

    describe('_collectToggledDescendantNodes', () => {
      it('returns an empty array for a node with no children', () => {
        expect((component as any)._collectToggledDescendantNodes({})).toEqual(
          []
        );
      });

      it('collects direct children only, when none are already expanded', () => {
        const child1 = {};
        const child2 = {};
        const node = { children: [child1, child2] };
        expect((component as any)._collectToggledDescendantNodes(node)).toEqual(
          [child1, child2]
        );
      });

      it('recurses into already-expanded children but not collapsed ones', () => {
        const grandchild = {};
        const expandedChild = { expanded: true, children: [grandchild] };
        const collapsedGrandchild = {};
        const collapsedChild = {
          expanded: false,
          children: [collapsedGrandchild]
        };
        const node = { children: [expandedChild, collapsedChild] };

        expect((component as any)._collectToggledDescendantNodes(node)).toEqual(
          [expandedChild, grandchild, collapsedChild]
        );
      });
    });

    describe('wiring into onNodeExpanded/onNodeCollapsed', () => {
      const expandEvent = { node: { data: { id: 1 } } };
      const collapseEvent = { node: { data: { id: 2 } } };

      itSchedulesRecalcAsMicrotask(
        'onNodeExpanded',
        () => component.onNodeExpanded(expandEvent),
        '_expandAutoLayoutIncremental',
        [expandEvent]
      );

      itSchedulesRecalcAsMicrotask(
        'onNodeCollapsed',
        () => component.onNodeCollapsed(collapseEvent),
        '_collapseAutoLayoutIncremental',
        [collapseEvent]
      );
    });
  });

  describe('onPaginatorKeydown navigation', () => {
    function makePageButtons(count: number): HTMLButtonElement[] {
      const buttons: HTMLButtonElement[] = [];
      for (let i = 0; i < count; i++) {
        const btn = document.createElement('button');
        btn.classList.add('p-paginator-page');
        btn.textContent = String(i + 1);
        buttons.push(btn);
        (component as any)._elementRef.nativeElement.appendChild(btn);
      }
      return buttons;
    }

    afterEach(() => {
      (component as any)._elementRef.nativeElement
        .querySelectorAll('.p-paginator-page')
        .forEach((el: HTMLElement) => el.remove());
    });

    it('should focus and click the next page button on ArrowRight', () => {
      const buttons = makePageButtons(3);
      const clickSpy = jest.spyOn(buttons[1], 'click');
      const focusSpy = jest.spyOn(buttons[1], 'focus');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(focusSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should focus and click the previous page button on ArrowLeft', () => {
      const buttons = makePageButtons(3);
      const clickSpy = jest.spyOn(buttons[0], 'click');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'target', { value: buttons[1] });
      component.onPaginatorKeydown(event);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should jump to the next page when at the last button but not the last page', () => {
      const buttons = makePageButtons(1);
      component.rows = 10;
      component.primengTreeTable.totalRecords = 100;
      jest.spyOn(component, 'changePage');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(component.changePage).toHaveBeenCalled();
    });

    it('should do nothing when already at the last page boundary going right', () => {
      const buttons = makePageButtons(1);
      buttons[0].textContent = '10';
      component.rows = 10;
      component.primengTreeTable.totalRecords = 100;
      jest.spyOn(component, 'changePage');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(component.changePage).not.toHaveBeenCalled();
    });

    it('should do nothing when already at the first page boundary going left', () => {
      const buttons = makePageButtons(1);
      buttons[0].textContent = '1';
      component.rows = 10;
      component.primengTreeTable.totalRecords = 100;
      jest.spyOn(component, 'changePage');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(component.changePage).not.toHaveBeenCalled();
    });
  });

  describe('_focusPaginatorSelectedPage', () => {
    it('should focus the currently selected page button', () => {
      const btn = document.createElement('button');
      btn.classList.add('p-paginator-page');
      btn.setAttribute('aria-current', 'page');
      (component as any)._elementRef.nativeElement.appendChild(btn);
      const focusSpy = jest.spyOn(btn, 'focus');
      (component as any)._focusPaginatorSelectedPage();
      expect(focusSpy).toHaveBeenCalled();
      btn.remove();
    });

    it('should do nothing when there is no selected page button', () => {
      expect(() =>
        (component as any)._focusPaginatorSelectedPage()
      ).not.toThrow();
    });
  });

  describe('onPageChange refocus behavior', () => {
    function flushMacrotask(): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, 0));
    }

    it('should refocus the selected page when leaving the first-page button at the start', async () => {
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
      const firstBtn = document.createElement('button');
      firstBtn.classList.add('p-paginator-first');
      (component as any).document = { activeElement: firstBtn };
      const focusPaginatorSpy = jest
        .spyOn(component as any, '_focusPaginatorSelectedPage')
        .mockImplementation(() => {});
      component.onPageChange({ first: 0, rows: 10 });
      await flushMacrotask();
      expect(focusPaginatorSpy).toHaveBeenCalled();
    });

    it('should recalc auto layout header widths asynchronously', async () => {
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
      const recalcSpy = jest
        .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
        .mockImplementation(() => {});
      component.onPageChange({ first: 10, rows: 10 });
      await flushMacrotask();
      expect(recalcSpy).toHaveBeenCalled();
    });
  });

  describe('onRowsPerPageChanged', () => {
    it('should reset to first page when resetPageOnRowsChange is true', () => {
      component.resetPageOnRowsChange = true;
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
      component.primengTreeTable.first = 20;
      jest.spyOn(component, 'changePage');
      component.onRowsPerPageChanged();
      expect(component.primengTreeTable.first).toBe(0);
      expect(component.changePage).toHaveBeenCalledWith(0);
    });

    it('should not reset first when resetPageOnRowsChange is false', () => {
      component.resetPageOnRowsChange = false;
      component.rows = 10;
      component.primengTreeTable.totalRecords = 30;
      component.primengTreeTable.first = 20;
      component.onRowsPerPageChanged();
      expect(component.primengTreeTable.first).toBe(20);
    });
  });

  describe('_onWindowResize', () => {
    it('should debounce and recalc virtual height', () => {
      jest.useFakeTimers();
      const recalcSpy = jest
        .spyOn(component as any, '_recalcVirtualHeight')
        .mockImplementation(() => {});
      (component as any)._onWindowResize();
      (component as any)._onWindowResize();
      jest.advanceTimersByTime(100);
      expect(recalcSpy).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('_setMinWidthOverall', () => {
    it('should do nothing when minWidthForBodyOnly is true', () => {
      component.minWidthForBodyOnly = true;
      component.minWidth = '500px';
      const setStyleSpy = jest.spyOn((component as any).renderer, 'setStyle');
      (component as any)._setMinWidthOverall();
      expect(setStyleSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when minWidth is not set', () => {
      component.minWidthForBodyOnly = false;
      component.minWidth = '';
      const setStyleSpy = jest.spyOn((component as any).renderer, 'setStyle');
      (component as any)._setMinWidthOverall();
      expect(setStyleSpy).not.toHaveBeenCalled();
    });

    it('should set min-width on the scrollable wrapper, paginator, loading overlay and header when present', () => {
      component.minWidthForBodyOnly = false;
      component.minWidth = '600px';
      component.scrollable = false;

      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const main = document.createElement('div');
      main.className = 'p-treetable';
      const paginatorEl = document.createElement('div');
      paginatorEl.className = 'p-paginator';
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'p-treetable-loading-overlay';
      main.appendChild(paginatorEl);
      main.appendChild(loadingOverlay);

      const scrollableWrapper = document.createElement('div');
      scrollableWrapper.className = 'p-treetable-scrollable-wrapper';

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'p-treetable-wrapper';

      const header = document.createElement('div');
      header.className = 'p-treetable-header';

      host.appendChild(main);
      host.appendChild(scrollableWrapper);
      host.appendChild(tableWrapper);
      host.appendChild(header);

      (component as any)._setMinWidthOverall();

      expect(main.style.overflow).toBe('auto');
      expect(paginatorEl.style.minWidth).toBe('600px');
      expect(loadingOverlay.style.minWidth).toBe('600px');
      expect(scrollableWrapper.style.minWidth).toBe('600px');
      expect(tableWrapper.style.minWidth).toBe('600px');
      expect(header.style.minWidth).toBe('600px');

      host.removeChild(main);
      host.removeChild(scrollableWrapper);
      host.removeChild(tableWrapper);
      host.removeChild(header);
    });

    it('should skip the non-scrollable table wrapper when scrollable is true', () => {
      component.minWidthForBodyOnly = false;
      component.minWidth = '600px';
      component.scrollable = true;

      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'p-treetable-wrapper';
      host.appendChild(tableWrapper);

      (component as any)._setMinWidthOverall();

      expect(tableWrapper.style.minWidth).toBe('');

      host.removeChild(tableWrapper);
    });
  });

  describe('_updateVirtualScrollItemSize', () => {
    it('should do nothing when virtualScroll is false', () => {
      component.virtualScroll = false;
      expect(() =>
        (component as any)._updateVirtualScrollItemSize()
      ).not.toThrow();
    });

    it('should do nothing when virtualScrollItemHeight is set', () => {
      component.virtualScroll = true;
      component.virtualScrollItemHeight = 40;
      component.virtualScrollItemSize = 99;
      (component as any)._updateVirtualScrollItemSize();

      expect(component.virtualScrollItemSize).toBe(99);
    });

    it('should do nothing when there are no body rows', () => {
      component.virtualScroll = true;
      component.virtualScrollItemHeight = 0;
      expect(() =>
        (component as any)._updateVirtualScrollItemSize()
      ).not.toThrow();
    });

    it('should measure the smallest row height across rows', () => {
      component.virtualScroll = true;
      component.virtualScrollItemHeight = 0;

      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const tbody = document.createElement('div');
      tbody.className = 'p-treetable-tbody';
      const makeRow = (height: number) => {
        const tr = document.createElement('tr');
        Object.defineProperty(tr, 'offsetHeight', {
          value: height,
          configurable: true
        });
        const td = document.createElement('td');
        Object.defineProperty(td, 'offsetHeight', {
          value: height,
          configurable: true
        });
        tr.appendChild(td);
        return tr;
      };
      const row1 = makeRow(50);
      const row2 = makeRow(30);
      tbody.appendChild(row1);
      tbody.appendChild(row2);
      host.appendChild(tbody);

      (component as any)._updateVirtualScrollItemSize();

      expect(component.virtualScrollItemSize).toBe(30);

      host.removeChild(tbody);
    });
  });

  describe('resizeObserver callback', () => {
    let capturedCallback: ((entries: any[]) => void) | undefined;
    let localFixture: ComponentFixture<CpsTreeTableComponent>;
    let localComponent: CpsTreeTableComponent;
    let OriginalRO: any;

    beforeEach(async () => {
      OriginalRO = window.ResizeObserver;
      (window as any).ResizeObserver = class {
        constructor(cb: (entries: any[]) => void) {
          capturedCallback = cb;
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CpsTreeTableComponent, NoopAnimationsModule],
        providers: [
          {
            provide: CPS_ROOT_FONT_SIZE_SERVICE,
            useValue: mockRootFontSizeService
          }
        ]
      }).compileComponents();
      localFixture = TestBed.createComponent(CpsTreeTableComponent);
      localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
    });

    afterEach(() => {
      window.ResizeObserver = OriginalRO;
    });

    it('should mark the scrollbar visible and apply overflow when virtualScroll is enabled', () => {
      (localComponent as any)._headerBox = document.createElement('div');
      (localComponent as any)._scrollableBody = document.createElement('div');
      (localComponent as any)._scrollbarWidth = 20;
      localComponent.virtualScroll = true;

      const target = document.createElement('div');
      Object.defineProperty(target, 'scrollHeight', {
        value: 200,
        configurable: true
      });
      Object.defineProperty(target, 'clientHeight', {
        value: 100,
        configurable: true
      });

      expect(() => capturedCallback?.([{ target }])).not.toThrow();
      expect((localComponent as any)._scrollbarVisible).toBe(true);
    });

    it('should mark the scrollbar not visible when scrollHeight does not exceed clientHeight', () => {
      (localComponent as any)._headerBox = document.createElement('div');
      (localComponent as any)._scrollableBody = document.createElement('div');
      localComponent.virtualScroll = false;

      const target = document.createElement('div');
      Object.defineProperty(target, 'scrollHeight', {
        value: 100,
        configurable: true
      });
      Object.defineProperty(target, 'clientHeight', {
        value: 100,
        configurable: true
      });

      capturedCallback?.([{ target }]);

      expect((localComponent as any)._scrollbarVisible).toBe(false);
    });
  });

  describe('_recalcVirtualHeight', () => {
    it('should hide overflow when there is no visible scrollbar and virtualScroll is enabled', () => {
      component.virtualScroll = true;
      (component as any)._scrollbarVisible = false;
      (component as any)._scrollableBody = document.createElement('div');
      (component as any)._recalcVirtualHeight();
      expect((component as any)._scrollableBody.style.overflow).toBe('hidden');
    });

    it('should compute scrollHeight from item size and item count as a microtask', async () => {
      component.virtualScroll = true;
      component.defScrollHeight = '400px';
      (component as any)._scrollableBody = document.createElement('div');
      component.virtualScrollItemSize = 40;
      component.primengTreeTable.serializedValue = [{}, {}, {}] as any;
      jest
        .spyOn(component as any, '_updateVirtualScrollItemSize')
        .mockImplementation(() => {});

      (component as any)._recalcVirtualHeight();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(component.scrollHeight).toContain('min(');
    });

    it('should compute an empty-body height when there are no items', async () => {
      component.virtualScroll = true;
      component.defScrollHeight = '400px';
      component.emptyBodyHeight = '10rem';
      (component as any)._scrollableBody = document.createElement('div');
      component.primengTreeTable.serializedValue = [] as any;
      jest
        .spyOn(component as any, '_updateVirtualScrollItemSize')
        .mockImplementation(() => {});

      (component as any)._recalcVirtualHeight();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(component.scrollHeight).toContain('calc(10rem');
    });

    it('should switch to flex height and mark for check when content exceeds the initial flex height', async () => {
      component.virtualScroll = true;
      component.defScrollHeight = 'flex';
      (component as any)._scrollableBody = document.createElement('div');
      component.virtualScrollItemSize = 100;
      (component as any)._defScrollHeightPxInitial = 50;
      component.primengTreeTable.serializedValue = [{}] as any;
      jest
        .spyOn(component as any, '_updateVirtualScrollItemSize')
        .mockImplementation(() => {});
      const markSpy = jest.spyOn((component as any).cdRef, 'markForCheck');

      (component as any)._recalcVirtualHeight();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(component.scrollHeight).toBe('flex');
      expect(markSpy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit / ngAfterViewChecked', () => {
    let originalOffsetParent: PropertyDescriptor | undefined;

    beforeEach(() => {
      // jsdom never lays out elements, so offsetParent is always null,
      // which would make ngAfterViewChecked's visibility guard treat the
      // component as hidden. Simulate a visible element by default.
      originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetParent'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get(): HTMLElement {
          return document.body;
        }
      });
    });

    afterEach(() => {
      if (originalOffsetParent) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetParent',
          originalOffsetParent
        );
      }
    });

    it('should remove an empty tfoot via _removeEmptyFooter', () => {
      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const tfoot = document.createElement('tfoot');
      tfoot.className = 'p-treetable-tfoot';
      const parent = document.createElement('div');
      parent.appendChild(tfoot);
      host.appendChild(parent);
      const removeChildSpy = jest.spyOn(
        (component as any).renderer,
        'removeChild'
      );

      (component as any)._removeEmptyFooter();

      expect(removeChildSpy).toHaveBeenCalledWith(parent, tfoot);
      host.removeChild(parent);
    });

    it('should leave a non-empty tfoot in place', () => {
      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const tfoot = document.createElement('tfoot');
      tfoot.className = 'p-treetable-tfoot';
      tfoot.appendChild(document.createElement('tr'));
      const parent = document.createElement('div');
      parent.appendChild(tfoot);
      host.appendChild(parent);

      (component as any)._removeEmptyFooter();

      expect(parent.contains(tfoot)).toBe(true);
      host.removeChild(parent);
    });

    it('should call _removeEmptyFooter from ngAfterViewInit when not scrollable', () => {
      component.scrollable = false;
      const removeSpy = jest
        .spyOn(component as any, '_removeEmptyFooter')
        .mockImplementation(() => {});
      component.ngAfterViewInit();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('should recalc header widths in ngAfterViewChecked when needed', () => {
      (component as any)._needRecalcAutoLayout = true;
      const recalcSpy = jest
        .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
        .mockImplementation(() => {});
      const markForCheckSpy = jest.spyOn(
        (component as any).cdRef,
        'markForCheck'
      );
      component.ngAfterViewChecked();
      expect(recalcSpy).toHaveBeenCalled();
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('should do nothing further in ngAfterViewChecked when virtualScroll is disabled', () => {
      (component as any)._needRecalcAutoLayout = false;
      component.virtualScroll = false;
      expect(() => component.ngAfterViewChecked()).not.toThrow();
    });

    it('should capture the initial flex scroll height once in ngAfterViewChecked', () => {
      (component as any)._needRecalcAutoLayout = false;
      component.virtualScroll = true;
      component.defScrollHeight = 'flex';
      (component as any)._defScrollHeightPx = 0;
      (component as any)._scrollableBody = document.createElement('div');
      Object.defineProperty(
        (component as any)._scrollableBody,
        'clientHeight',
        { value: 250, configurable: true }
      );
      component.virtualScrollItemSize = 1;

      component.ngAfterViewChecked();

      expect((component as any)._defScrollHeightPx).toBe(250);
      expect((component as any)._defScrollHeightPxInitial).toBe(250);
    });
  });

  describe('ngAfterViewInit — scrollable-body branches', () => {
    function buildScrollableHost(): {
      host: HTMLElement;
      scrollableBody: HTMLElement;
      innerTable: HTMLTableElement;
    } {
      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const scrollableBody = document.createElement('div');
      scrollableBody.className = 'p-treetable-scrollable-body';
      const innerTable = document.createElement('table');
      scrollableBody.appendChild(innerTable);
      host.appendChild(scrollableBody);
      return { host, scrollableBody, innerTable };
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should set min-width on the scrollable-body table when minWidthForBodyOnly is enabled', () => {
      const { innerTable } = buildScrollableHost();
      component.minWidthForBodyOnly = true;
      component.minWidth = '400px';
      component.virtualScroll = false;

      component.ngAfterViewInit();

      expect(innerTable.style.minWidth).toBe('400px');
    });

    it('should not set min-width on the scrollable-body table when there is no table element', () => {
      const { scrollableBody } = buildScrollableHost();
      scrollableBody.removeChild(scrollableBody.firstChild!);
      component.minWidthForBodyOnly = true;
      component.minWidth = '400px';
      component.virtualScroll = false;

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });

    it('should skip min-width handling when minWidthForBodyOnly is false', () => {
      const { innerTable } = buildScrollableHost();
      component.minWidthForBodyOnly = false;
      component.minWidth = '400px';
      component.virtualScroll = false;

      component.ngAfterViewInit();

      expect(innerTable.style.minWidth).toBe('');
    });

    it('should set tabIndex and capture the initial flex height for virtualScroll', () => {
      const { scrollableBody } = buildScrollableHost();
      Object.defineProperty(scrollableBody, 'clientHeight', {
        value: 300,
        configurable: true
      });
      component.virtualScroll = true;
      component.defScrollHeight = 'flex';
      component.autoLayout = false;

      component.ngAfterViewInit();

      expect(scrollableBody.tabIndex).toBe(-1);
      expect((component as any)._defScrollHeightPx).toBe(300);
      expect((component as any)._defScrollHeightPxInitial).toBe(300);
    });

    it('should not capture flex height when defScrollHeight is not "flex"', () => {
      buildScrollableHost();
      component.virtualScroll = true;
      component.defScrollHeight = '400px';
      component.autoLayout = false;
      (component as any)._defScrollHeightPx = 0;

      component.ngAfterViewInit();

      expect((component as any)._defScrollHeightPx).toBe(0);
    });

    it('should subscribe to scroll events for auto layout recalculation when autoLayout is enabled', async () => {
      const { scrollableBody } = buildScrollableHost();
      component.virtualScroll = true;
      component.defScrollHeight = '400px';
      component.autoLayout = true;
      const recalcSpy = jest
        .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
        .mockImplementation(() => {});

      component.ngAfterViewInit();
      recalcSpy.mockClear();
      scrollableBody.dispatchEvent(new Event('scroll'));
      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      expect(recalcSpy).toHaveBeenCalled();
      (component as any)._scrollSubscription?.unsubscribe();
    });

    it('should skip virtualScroll-specific setup when virtualScroll is disabled', () => {
      const { scrollableBody } = buildScrollableHost();
      scrollableBody.tabIndex = 0;
      component.virtualScroll = false;

      component.ngAfterViewInit();

      expect(scrollableBody.tabIndex).toBe(0);
    });

    it('should set min-width on the header-box table and observe the scrollable body when the header box is found', () => {
      const { host } = buildScrollableHost();
      const headerBox = document.createElement('div');
      headerBox.className = 'p-treetable-scrollable-header-box';
      const headerTable = document.createElement('table');
      headerBox.appendChild(headerTable);
      host.appendChild(headerBox);
      component.minWidthForBodyOnly = true;
      component.minWidth = '350px';
      component.virtualScroll = false;
      const observeSpy = jest.spyOn(
        (component as any)._resizeObserver,
        'observe'
      );

      component.ngAfterViewInit();

      expect(headerTable.style.minWidth).toBe('350px');
      expect(observeSpy).toHaveBeenCalled();
    });

    it('should not throw when there is no header box', () => {
      buildScrollableHost();
      component.virtualScroll = false;

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });

    it('should recalc header widths and detect changes when needed after view init', () => {
      buildScrollableHost();
      (component as any)._needRecalcAutoLayout = true;
      const recalcSpy = jest
        .spyOn(component as any, '_calcAutoLayoutHeaderWidths')
        .mockImplementation(() => {});
      const detectSpy = jest.spyOn((component as any).cdRef, 'detectChanges');

      component.ngAfterViewInit();

      expect(recalcSpy).toHaveBeenCalled();
      expect(detectSpy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit — non-scrollable table wrapper', () => {
    it('should set min-width on the non-scrollable table wrapper', () => {
      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'p-treetable-wrapper';
      const table = document.createElement('table');
      wrapper.appendChild(table);
      host.appendChild(wrapper);
      component.scrollable = false;
      component.minWidthForBodyOnly = true;
      component.minWidth = '500px';

      component.ngAfterViewInit();

      expect(table.style.minWidth).toBe('500px');
    });

    it('should not throw when the non-scrollable wrapper has no table', () => {
      const host = (component as any).primengTreeTable.el
        .nativeElement as HTMLElement;
      host.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'p-treetable-wrapper';
      host.appendChild(wrapper);
      component.scrollable = false;
      component.minWidthForBodyOnly = true;
      component.minWidth = '500px';

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('ngOnDestroy virtualScroll cleanup', () => {
    it('should unsubscribe the scroll subscription and remove the resize listener when virtualScroll and autoLayout are enabled', () => {
      component.virtualScroll = true;
      component.autoLayout = true;
      const sub = { unsubscribe: jest.fn() };
      (component as any)._scrollSubscription = sub;
      const removeSpy = jest.spyOn(
        (component as any).window,
        'removeEventListener'
      );

      component.ngOnDestroy();

      expect(sub.unsubscribe).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should skip the scroll unsubscribe when autoLayout is disabled', () => {
      component.virtualScroll = true;
      component.autoLayout = false;
      const sub = { unsubscribe: jest.fn() };
      (component as any)._scrollSubscription = sub;

      component.ngOnDestroy();

      expect(sub.unsubscribe).not.toHaveBeenCalled();
    });

    it('should do nothing extra when virtualScroll is disabled', () => {
      component.virtualScroll = false;
      const removeSpy = jest.spyOn(
        (component as any).window,
        'removeEventListener'
      );

      component.ngOnDestroy();

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('_calcAutoLayoutHeaderWidths early returns', () => {
    it('should do nothing when autoLayout is disabled', () => {
      component.autoLayout = false;
      component.scrollable = true;
      expect(() =>
        (component as any)._calcAutoLayoutHeaderWidths()
      ).not.toThrow();
    });

    it('should do nothing when not scrollable', () => {
      component.autoLayout = true;
      component.scrollable = false;
      expect(() =>
        (component as any)._calcAutoLayoutHeaderWidths()
      ).not.toThrow();
    });

    it('should not call _calcAutoLayoutHeaderWidths from ngAfterViewChecked when no recalculation is needed', () => {
      const originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetParent'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get(): HTMLElement {
          return document.body;
        }
      });

      try {
        component.autoLayout = true;
        component.scrollable = true;
        (component as any)._needRecalcAutoLayout = false;
        const recalcSpy = jest.spyOn(
          component as any,
          '_calcAutoLayoutHeaderWidths'
        );

        component.ngAfterViewChecked();

        expect(recalcSpy).not.toHaveBeenCalled();
      } finally {
        if (originalOffsetParent) {
          Object.defineProperty(
            HTMLElement.prototype,
            'offsetParent',
            originalOffsetParent
          );
        }
      }
    });
  });

  describe('nodeTestKey', () => {
    it('returns the index of the rowNode within primengTreeTable.serializedValue', () => {
      const rowNode = { node: { data: { name: 'a' } } };
      (component.primengTreeTable as any).serializedValue = [
        { node: { data: { name: 'z' } } },
        rowNode
      ];
      expect(component.nodeTestKey(rowNode)).toBe('1');
    });

    it('returns "-1" when the rowNode is not found', () => {
      (component.primengTreeTable as any).serializedValue = [];
      expect(component.nodeTestKey({})).toBe('-1');
    });

    it('rebuilds its index cache only when serializedValue is replaced with a new array, not on every call', () => {
      const rowNodeA = { node: { data: { name: 'a' } } };
      const rowNodeB = { node: { data: { name: 'b' } } };
      const serializedValue = [rowNodeA, rowNodeB];
      (component.primengTreeTable as any).serializedValue = serializedValue;

      expect(component.nodeTestKey(rowNodeA)).toBe('0');
      expect(component.nodeTestKey(rowNodeB)).toBe('1');
      expect(component.nodeTestKey(rowNodeA)).toBe('0');
      expect((component as any)._nodeIndexCacheSource).toBe(serializedValue);

      const newSerializedValue = [rowNodeB, rowNodeA];
      (component.primengTreeTable as any).serializedValue = newSerializedValue;

      expect(component.nodeTestKey(rowNodeA)).toBe('1');
      expect(component.nodeTestKey(rowNodeB)).toBe('0');
      expect((component as any)._nodeIndexCacheSource).toBe(newSerializedValue);
    });
  });
});
