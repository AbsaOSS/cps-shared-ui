import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
