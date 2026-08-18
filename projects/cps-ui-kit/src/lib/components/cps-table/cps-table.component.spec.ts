import { SimpleChange } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseComponent } from 'primeng/basecomponent';
import { CPS_LIVE_ANNOUNCER_SERVICE } from '../../services/cps-live-announcer/cps-live-announcer.service';
import { CpsTableComponent } from './cps-table.component';

describe('CpsTableComponent', () => {
  let fixture: ComponentFixture<CpsTableComponent>;
  let component: CpsTableComponent;
  let mockAnnouncer: { announce: jest.Mock };

  beforeEach(async () => {
    mockAnnouncer = { announce: jest.fn() };

    jest
      .spyOn(BaseComponent.prototype, 'ngOnInit')
      .mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [CpsTableComponent, NoopAnimationsModule],
      providers: [
        { provide: CPS_LIVE_ANNOUNCER_SERVICE, useValue: mockAnnouncer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a primengTable ViewChild', () => {
    expect(component.primengTable).toBeTruthy();
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
    it('should default reorderableRows to false', () =>
      expect(component.reorderableRows).toBe(false));
    it('should default emptyMessage to "No data"', () =>
      expect(component.emptyMessage).toBe('No data'));
    it('should default data to empty array', () =>
      expect(component.data).toEqual([]));
    it('should default selectedRows to empty array', () =>
      expect(component.selectedRows).toEqual([]));
  });

  describe('data setter / getter', () => {
    it('should store a copy of the array', () => {
      const arr = [{ id: 1 }, { id: 2 }];
      component.data = arr;
      expect(component.data).toEqual(arr);
      expect(component.data).not.toBe(arr);
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
      it('should derive globalFilterFields from data keys when showGlobalFilter is true and fields are empty', () => {
        component.showGlobalFilter = true;
        component.globalFilterFields = [];
        component.data = [{ name: 'Alice', age: 30 }];
        component.ngOnInit();
        expect(component.globalFilterFields).toEqual(['name', 'age']);
      });

      it('should not override existing globalFilterFields', () => {
        component.showGlobalFilter = true;
        component.globalFilterFields = ['name'];
        component.data = [{ name: 'Alice', age: 30 }];
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
    it('should return "cps-tbar-normal" by default', () => {
      expect(component.styleClass).toBe('cps-tbar-normal');
    });

    it('should return "cps-tbar-small" when toolbarSize is "small"', () => {
      component.toolbarSize = 'small';
      expect(component.styleClass).toBe('cps-tbar-small');
    });

    it('should return empty string when hasToolbar is false', () => {
      component.hasToolbar = false;
      expect(component.styleClass).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should clear selection when loading becomes true', () => {
      component.selectedRows = [{ id: 1 }];
      component.loading = true;
      component.ngOnChanges({ loading: new SimpleChange(false, true, false) });
      expect(component.selectedRows).toEqual([]);
    });

    it('should not clear selection when loading is false', () => {
      component.selectedRows = [{ id: 1 }];
      component.loading = false;
      component.ngOnChanges({ loading: new SimpleChange(true, false, false) });
      expect(component.selectedRows).toEqual([{ id: 1 }]);
    });

    it('should filter selectedRows to only keep rows still in data', () => {
      const row1 = { id: 1 };
      const row2 = { id: 2 };
      component.data = [row1, row2];
      component.selectedRows = [row1, row2];

      component.data = [row1];
      component.ngOnChanges({
        data: new SimpleChange([row1, row2], [row1], false)
      });

      expect(component.selectedRows).toEqual([row1]);
    });

    it('should call clearGlobalFilter when loading and clearGlobalFilterOnLoading are true', () => {
      component.clearGlobalFilterOnLoading = true;
      component.loading = true;
      jest.spyOn(component, 'clearGlobalFilter');
      component.ngOnChanges({ loading: new SimpleChange(false, true, false) });
      expect(component.clearGlobalFilter).toHaveBeenCalled();
    });

    it('should rebuild tablePassthrough when data changes', () => {
      const before = component.tablePassthrough;
      component.ngOnChanges({ data: new SimpleChange([], [{ id: 1 }], false) });
      expect(component.tablePassthrough).not.toBe(before);
    });
  });

  describe('clearSelection', () => {
    it('should set selectedRows to empty array', () => {
      component.selectedRows = [{ id: 1 }, { id: 2 }];
      component.clearSelection();
      expect(component.selectedRows).toEqual([]);
    });
  });

  describe('onSelectionChanged', () => {
    it('should emit rowsSelected with the selection', () => {
      jest.spyOn(component.rowsSelected, 'emit');
      const rows = [{ id: 1 }];
      component.primengTable.value = rows;
      component.onSelectionChanged(rows);
      expect(component.rowsSelected.emit).toHaveBeenCalledWith(rows);
    });

    it('should emit selectedRowIndexes with correct indexes', () => {
      jest.spyOn(component.selectedRowIndexes, 'emit');
      const row = { id: 1 };
      component.primengTable.value = [{ id: 0 }, row, { id: 2 }];
      component.onSelectionChanged([row]);
      expect(component.selectedRowIndexes.emit).toHaveBeenCalledWith([1]);
    });
  });

  describe('rowTestKey', () => {
    it('should return the rowIndex as a string when dataKey is not set', () => {
      expect(component.rowTestKey({ id: 'a1' }, 3)).toBe('3');
    });

    it('should return the resolved field value when dataKey is a flat field name', () => {
      component.dataKey = 'id';
      expect(component.rowTestKey({ id: 'a1' }, 3)).toBe('a1');
    });

    it('should resolve a nested/dot-path dataKey the same way PrimeNG does', () => {
      component.dataKey = 'user.id';
      expect(component.rowTestKey({ user: { id: 'u1' } }, 3)).toBe('u1');
    });

    it('should fall back to the rowIndex when the resolved dataKey value is undefined, so rows with a missing key never collide on the same testid', () => {
      component.dataKey = 'id';
      expect(component.rowTestKey({}, 3)).toBe('3');
    });

    it('should fall back to the rowIndex when the resolved dataKey value is null', () => {
      component.dataKey = 'id';
      expect(component.rowTestKey({ id: null }, 3)).toBe('3');
    });

    it('should fall back to the rowIndex when the resolved dataKey value is an empty string', () => {
      component.dataKey = 'id';
      expect(component.rowTestKey({ id: '' }, 3)).toBe('3');
    });

    it('should still return a resolved value of 0, not fall back to rowIndex, since 0 is a legitimate id', () => {
      component.dataKey = 'id';
      expect(component.rowTestKey({ id: 0 }, 3)).toBe('0');
    });
  });

  describe('onSortFunction', () => {
    it('should emit customSortFunction with the event', () => {
      jest.spyOn(component.customSortFunction, 'emit');
      const event = {
        data: [],
        field: 'name',
        order: 1,
        mode: 'single'
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

  describe('onRowReorder', () => {
    it('should emit rowsReordered with the event', () => {
      jest.spyOn(component.rowsReordered, 'emit');
      const event = { dragIndex: 0, dropIndex: 1 };
      component.onRowReorder(event);
      expect(component.rowsReordered.emit).toHaveBeenCalledWith(event);
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
      const row = { id: 1 };
      component.primengTable.value = [row];
      component.selectedRows = [row];
      component.removeSelected();
      expect(component.rowsToRemove.emit).toHaveBeenCalledWith([row]);
    });

    it('should emit rowIndexesToRemove with correct indexes', () => {
      jest.spyOn(component.rowIndexesToRemove, 'emit');
      const row = { id: 1 };
      component.primengTable.value = [{ id: 0 }, row];
      component.selectedRows = [row];
      component.removeSelected();
      expect(component.rowIndexesToRemove.emit).toHaveBeenCalledWith([1]);
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
      component.selectedRows = [{ id: 1 }];
      component.onClickAdditionalBtnOnSelect();
      expect(component.additionalBtnOnSelectClicked.emit).toHaveBeenCalledWith([
        { id: 1 }
      ]);
    });
  });

  describe('onEditRowClicked', () => {
    it('should emit editRowBtnClicked with row and its index in primengTable.value', () => {
      jest.spyOn(component.editRowBtnClicked, 'emit');
      const row = { id: 2 };
      component.primengTable.value = [{ id: 1 }, row, { id: 3 }];
      component.onEditRowClicked(row);
      expect(component.editRowBtnClicked.emit).toHaveBeenCalledWith({
        row,
        index: 1
      });
    });
  });

  describe('onRemoveRowClicked', () => {
    it('should emit rowsToRemove with the item', () => {
      jest.spyOn(component.rowsToRemove, 'emit');
      const item = { id: 5 };
      component.primengTable.value = [item];
      component.onRemoveRowClicked(item);
      expect(component.rowsToRemove.emit).toHaveBeenCalledWith([item]);
    });

    it('should emit rowIndexesToRemove with the item index', () => {
      jest.spyOn(component.rowIndexesToRemove, 'emit');
      const item = { id: 5 };
      component.primengTable.value = [{ id: 0 }, item];
      component.onRemoveRowClicked(item);
      expect(component.rowIndexesToRemove.emit).toHaveBeenCalledWith([1]);
    });
  });

  describe('onColumnsSelectedChange', () => {
    it('should set selectedColumns', () => {
      const cols = [{ header: 'Name', field: 'name' }];
      component.onColumnsSelectedChange(cols);
      expect(component.selectedColumns).toEqual(cols);
    });

    it('should emit columnsSelected', () => {
      jest.spyOn(component.columnsSelected, 'emit');
      const cols = [{ header: 'Age', field: 'age' }];
      component.onColumnsSelectedChange(cols);
      expect(component.columnsSelected.emit).toHaveBeenCalledWith(cols);
    });
  });

  describe('exportTable', () => {
    it('should throw when columns is empty', () => {
      component.columns = [];
      expect(() => component.exportTable('csv')).toThrow(
        'Columns must be defined!'
      );
    });

    it('should throw when selectedColumns is empty', () => {
      component.columns = [{ header: 'Name', field: 'name' }];
      component.selectedColumns = [];
      expect(() => component.exportTable('csv')).toThrow('Nothing to export!');
    });

    it('should call primengTable.exportCSV for csv format', () => {
      component.columns = [{ header: 'Name', field: 'name' }];
      component.selectedColumns = component.columns;
      jest
        .spyOn(component.primengTable, 'exportCSV')
        .mockImplementation(() => {});
      component.exportTable('csv');
      expect(component.primengTable.exportCSV).toHaveBeenCalled();
    });
  });

  describe('pagination helpers', () => {
    beforeEach(() => {
      component.rows = 10;
      component.primengTable.totalRecords = 30;
    });

    it('getPageCount should return total pages', () => {
      expect(component.getPageCount()).toBe(3);
    });

    it('getPage should return 0 when primengTable.first is 0', () => {
      component.primengTable.first = 0;
      expect(component.getPage()).toBe(0);
    });

    it('getPage should return correct page from primengTable.first', () => {
      component.primengTable.first = 20;
      expect(component.getPage()).toBe(2);
    });

    it('changePage should call primengTable.onPageChange for valid page', () => {
      jest
        .spyOn(component.primengTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(1);
      expect(component.primengTable.onPageChange).toHaveBeenCalledWith({
        first: 10,
        rows: 10
      });
    });

    it('changePage should ignore out-of-bounds page', () => {
      jest
        .spyOn(component.primengTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(5);
      expect(component.primengTable.onPageChange).not.toHaveBeenCalled();
    });

    it('changePage should ignore negative page', () => {
      jest
        .spyOn(component.primengTable, 'onPageChange')
        .mockImplementation(() => {});
      component.changePage(-1);
      expect(component.primengTable.onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard drag (_onDragHandleKeydown)', () => {
    const data = [{ id: 0 }, { id: 1 }, { id: 2 }];

    beforeEach(() => {
      component.data = [...data];
    });

    it('should activate drag on Enter when no drag is active', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      jest.spyOn(event, 'preventDefault');
      component._onDragHandleKeydown(event, 1);
      expect(component.keyboardDragRowIndex).toBe(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should activate drag on Space when no drag is active', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      jest.spyOn(event, 'preventDefault');
      component._onDragHandleKeydown(event, 0);
      expect(component.keyboardDragRowIndex).toBe(0);
    });

    it('should announce pickup on activation', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        2
      );
      expect(mockAnnouncer.announce).toHaveBeenCalledWith(
        'Row 3 picked up. Press arrow keys to move, Enter to confirm, Escape to cancel.'
      );
    });

    it('should confirm drag on Enter when drag is active and emit rowsReordered', () => {
      jest.spyOn(component.rowsReordered, 'emit');
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBeNull();
      expect(component.rowsReordered.emit).toHaveBeenCalledWith({
        dragIndex: 0,
        dropIndex: 1
      });
    });

    it('should cancel drag on Escape and restore data', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Escape' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBeNull();
      expect(component.data).toEqual(data);
    });

    it('should move row up on ArrowUp when drag is active', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        1
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowUp' }),
        1
      );
      expect(component.keyboardDragRowIndex).toBe(0);
      expect((component as unknown as { _data: unknown[] })._data[0]).toEqual({
        id: 1
      });
    });

    it('should move row down on ArrowDown when drag is active', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        1
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        1
      );
      expect(component.keyboardDragRowIndex).toBe(2);
      expect((component as unknown as { _data: unknown[] })._data[2]).toEqual({
        id: 1
      });
    });

    it('should not move above row 0', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowUp' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBe(0);
    });

    it('should not move below last row', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        2
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        2
      );
      expect(component.keyboardDragRowIndex).toBe(2);
    });

    it('should do nothing on unrecognized key when drag is not active', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Tab' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBeNull();
    });

    it('should do nothing on arrow keys when drag is not active', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowUp' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBeNull();
    });
  });

  describe('_onDragHandleBlur', () => {
    it('should cancel drag when keyboardDragRowIndex is set', () => {
      component.data = [{ id: 0 }, { id: 1 }];
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      expect(component.keyboardDragRowIndex).toBe(0);
      component._onDragHandleBlur();
      expect(component.keyboardDragRowIndex).toBeNull();
    });

    it('should not cancel drag when _movingFocus is true', () => {
      component.data = [{ id: 0 }, { id: 1 }];
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      (component as unknown as { _movingFocus: boolean })._movingFocus = true;
      component._onDragHandleBlur();
      expect(component.keyboardDragRowIndex).toBe(0);
    });

    it('should do nothing when drag is not active', () => {
      expect(component.keyboardDragRowIndex).toBeNull();
      expect(() => component._onDragHandleBlur()).not.toThrow();
    });
  });

  describe('exportTable xlsx', () => {
    it('should delegate to exportXLSX for xlsx format', () => {
      component.columns = [{ header: 'Name', field: 'name' }];
      component.selectedColumns = component.columns;
      jest.spyOn(component, 'exportXLSX').mockImplementation(() => {});
      component.exportTable('xlsx');
      expect(component.exportXLSX).toHaveBeenCalled();
    });
  });

  describe('exportXLSX', () => {
    it('should build a workbook and trigger a download', async () => {
      component.data = [{ name: 'Alice' }, { name: 'Bob' }];
      component.columns = [{ header: 'Name', field: 'name' }];
      component.selectedColumns = component.columns;
      component.exportFilename = 'my-export';

      const realCreateElement = document.createElement.bind(document);
      const anchor = realCreateElement('a');
      const clickSpy = jest.spyOn(anchor, 'click').mockImplementation(() => {});
      jest
        .spyOn(document, 'createElement')
        .mockImplementation((tag: string) =>
          tag === 'a' ? anchor : realCreateElement(tag)
        );
      if (!URL.createObjectURL) {
        (URL as any).createObjectURL = () => 'blob:mock';
      }
      const urlSpy = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock');

      component.exportXLSX();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(urlSpy).toHaveBeenCalled();
      expect(anchor.download).toBe('my-export.xlsx');
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('onFilterGlobal', () => {
    it('should call primengTable.filterGlobal with the value and "contains"', () => {
      jest
        .spyOn(component.primengTable, 'filterGlobal')
        .mockImplementation(() => {});
      component.onFilterGlobal('abc');
      expect(component.primengTable.filterGlobal).toHaveBeenCalledWith(
        'abc',
        'contains'
      );
    });
  });

  describe('onRowsPerPageChanged', () => {
    it('should reset to first page when resetPageOnRowsChange is true', () => {
      component.resetPageOnRowsChange = true;
      component.rows = 10;
      component.primengTable.totalRecords = 30;
      component.primengTable.first = 20;
      jest.spyOn(component, 'changePage');
      component.onRowsPerPageChanged();
      expect(component.primengTable.first).toBe(0);
      expect(component.changePage).toHaveBeenCalledWith(0);
    });

    it('should not reset first when resetPageOnRowsChange is false', () => {
      component.resetPageOnRowsChange = false;
      component.rows = 10;
      component.primengTable.totalRecords = 30;
      component.primengTable.first = 20;
      jest.spyOn(component, 'changePage');
      component.onRowsPerPageChanged();
      expect(component.primengTable.first).toBe(20);
    });
  });

  describe('clearGlobalFilter / resetSortingState', () => {
    it('should call clear on the global filter component when present', () => {
      const clearSpy = jest.fn();
      (component as any).globalFilterComp = { clear: clearSpy };
      component.clearGlobalFilter();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should do nothing when there is no global filter component', () => {
      (component as any).globalFilterComp = undefined;
      expect(() => component.clearGlobalFilter()).not.toThrow();
    });

    it('should call resetDefaultSortOrder on the unsort directive when present', () => {
      const resetSpy = jest.fn();
      (component as any).tUnsortDirective = {
        resetDefaultSortOrder: resetSpy
      };
      component.resetSortingState();
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should do nothing when there is no unsort directive', () => {
      (component as any).tUnsortDirective = undefined;
      expect(() => component.resetSortingState()).not.toThrow();
    });
  });

  describe('onExportData / onExportMenuShown', () => {
    it('should do nothing when the export button is disabled', () => {
      component.exportBtnDisabled = true;
      (component as any).exportMenu = { toggle: jest.fn() };
      component.onExportData(new Event('click'));
      expect((component as any).exportMenu.toggle).not.toHaveBeenCalled();
    });

    it('should toggle the export menu when enabled', () => {
      component.exportBtnDisabled = false;
      const toggle = jest.fn();
      (component as any).exportMenu = { toggle };
      const event = new Event('click');
      component.onExportData(event);
      expect(toggle).toHaveBeenCalledWith(event);
    });

    it('should size the export menu container to the target width', () => {
      const container = document.createElement('div');
      const target = document.createElement('button');
      Object.defineProperty(target, 'offsetWidth', {
        value: 120,
        configurable: true
      });
      (component as any).exportMenu = { container, target };
      component.onExportMenuShown();
      expect(component.isExportMenuOpen).toBe(true);
      expect(container.style.width).toBe('120px');
    });

    it('should not throw when the export menu container or target is missing', () => {
      (component as any).exportMenu = { container: null, target: null };
      expect(() => component.onExportMenuShown()).not.toThrow();
    });
  });

  describe('ngAfterViewChecked', () => {
    it('should set the header height custom property once the header has a height', () => {
      component.scrollHeight = '400px';
      (component as any)._headerHeightSet = false;
      const headerEl = document.createElement('div');
      headerEl.className = 'p-datatable-header';
      Object.defineProperty(headerEl, 'offsetHeight', {
        value: 48,
        configurable: true
      });
      const tableRoot = document.createElement('div');
      tableRoot.appendChild(headerEl);
      (component as any).primengTable = {
        ...component.primengTable,
        el: { nativeElement: tableRoot }
      };
      component.ngAfterViewChecked();
      expect(tableRoot.style.getPropertyValue('--cps-header-height')).toBe(
        '48px'
      );
      expect((component as any)._headerHeightSet).toBe(true);
    });

    it('should compute virtualScrollItemSize from the first row when virtualScroll is enabled', () => {
      component.scrollHeight = '';
      component.virtualScroll = true;
      component.virtualScrollItemSize = 0;
      const tr = document.createElement('tr');
      Object.defineProperty(tr, 'clientHeight', {
        value: 42,
        configurable: true
      });
      const tbody = document.createElement('tbody');
      tbody.className = 'p-datatable-tbody';
      tbody.appendChild(tr);
      const tableRoot = document.createElement('div');
      tableRoot.appendChild(tbody);
      (component as any).primengTable = {
        ...component.primengTable,
        el: { nativeElement: tableRoot }
      };
      const cdSpy = jest.spyOn((component as any)._cdRef, 'detectChanges');
      component.ngAfterViewChecked();
      expect(component.virtualScrollItemSize).toBe(42);
      expect(cdSpy).toHaveBeenCalled();
    });

    it('should skip virtualScrollItemSize computation once already set', () => {
      component.scrollHeight = '';
      component.virtualScroll = true;
      component.virtualScrollItemSize = 42;
      const cdSpy = jest.spyOn((component as any)._cdRef, 'detectChanges');
      component.ngAfterViewChecked();
      expect(cdSpy).not.toHaveBeenCalled();
    });
  });

  describe('onPaginatorKeydown', () => {
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

    it('should ignore non-arrow keys', () => {
      const btn = document.createElement('button');
      btn.classList.add('p-paginator-page');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(event, 'target', { value: btn });
      jest.spyOn(event, 'preventDefault');
      component.onPaginatorKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should ignore keys from non-page-button targets', () => {
      const div = document.createElement('div');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: div });
      jest.spyOn(event, 'preventDefault');
      component.onPaginatorKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
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

    it('should jump to the next page when at the last button but not at the last page', fakeAsync(() => {
      const buttons = makePageButtons(1);
      component.rows = 10;
      component.primengTable.totalRecords = 100;
      jest.spyOn(component, 'changePage');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(component.changePage).toHaveBeenCalled();
      tick();
    }));

    it('should do nothing when already at the last page boundary going right', () => {
      const buttons = makePageButtons(1);
      buttons[0].textContent = '10';
      component.rows = 10;
      component.primengTable.totalRecords = 100;
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
      component.primengTable.totalRecords = 100;
      jest.spyOn(component, 'changePage');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'target', { value: buttons[0] });
      component.onPaginatorKeydown(event);
      expect(component.changePage).not.toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update first/rows and emit pageChanged', () => {
      component.rows = 10;
      component.primengTable.totalRecords = 30;
      jest.spyOn(component.pageChanged, 'emit');
      component.onPageChange({ first: 10, rows: 10 });
      expect(component.first).toBe(10);
      expect(component.rows).toBe(10);
      expect(component.pageChanged.emit).toHaveBeenCalled();
    });

    it('should refocus the selected page button when moving away from the first-page button at the start', fakeAsync(() => {
      component.rows = 10;
      component.primengTable.totalRecords = 30;
      const firstBtn = document.createElement('button');
      firstBtn.classList.add('p-paginator-first');
      document.body.appendChild(firstBtn);
      jest.spyOn(document, 'activeElement', 'get').mockReturnValue(firstBtn);
      const focusPaginatorSpy = jest
        .spyOn(component as any, '_focusPaginatorSelectedPage')
        .mockImplementation(() => {});
      component.onPageChange({ first: 0, rows: 10 });
      tick();
      expect(focusPaginatorSpy).toHaveBeenCalled();
      document.body.removeChild(firstBtn);
    }));

    it('should not refocus when not at a paginator boundary', () => {
      component.rows = 10;
      component.primengTable.totalRecords = 30;
      const focusPaginatorSpy = jest.spyOn(
        component as any,
        '_focusPaginatorSelectedPage'
      );
      component.onPageChange({ first: 10, rows: 10 });
      expect(focusPaginatorSpy).not.toHaveBeenCalled();
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

  describe('keyboard drag focus handling', () => {
    beforeEach(() => {
      component.data = [{ id: 0 }, { id: 1 }, { id: 2 }];
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
    });

    function makeDragHandle(rowIndex: number): HTMLElement {
      const handle = document.createElement('div');
      handle.classList.add('cps-table-row-drag-handle');
      handle.setAttribute('data-row-index', String(rowIndex));
      (component as any)._elementRef.nativeElement.appendChild(handle);
      return handle;
    }

    afterEach(() => {
      (component as any)._elementRef.nativeElement
        .querySelectorAll('.cps-table-row-drag-handle')
        .forEach((el: HTMLElement) => el.remove());
    });

    it('should focus the drag handle for the moved row after moving', fakeAsync(() => {
      const handle = makeDragHandle(2);
      const focusSpy = jest.spyOn(handle, 'focus');
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        1
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        1
      );
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should focus the drag handle at the drop position after confirming', () => {
      const handle = makeDragHandle(0);
      const focusSpy = jest.spyOn(handle, 'focus');
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should focus the drag handle at the original position after cancelling', () => {
      const handle = makeDragHandle(0);
      const focusSpy = jest.spyOn(handle, 'focus');
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Escape' }),
        0
      );
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should not throw when the drag handle element is not in the DOM', () => {
      component._onDragHandleKeydown(
        new KeyboardEvent('keydown', { key: 'Enter' }),
        0
      );
      expect(() =>
        component._onDragHandleKeydown(
          new KeyboardEvent('keydown', { key: 'Enter' }),
          0
        )
      ).not.toThrow();
    });
  });
});
