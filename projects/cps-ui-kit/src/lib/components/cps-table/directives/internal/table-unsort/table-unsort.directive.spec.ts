import { Table } from '../../../../../primeng-temp/table/public_api';
import { TableUnsortDirective } from './table-unsort.directive';

type Row = { id: number; name: string };

function buildMockTable(rows: Row[] = []) {
  const mock = {
    // Overwritten by TableUnsortDirective's constructor; declared here so
    // calls to mockTable.sort(...) below type-check.
    sort: undefined as unknown as (event: { field: string }) => void,
    sortMode: 'single' as 'single' | 'multiple',
    defaultSortOrder: 1,
    groupRowsBy: undefined as string | undefined,
    groupRowsByOrder: 1,
    restoringSort: false,
    lazy: false,
    customSort: false,
    filterLocale: undefined as string | undefined,
    anchorRowIndex: undefined as number | undefined,
    sortFunction: { emit: jest.fn() },
    onLazyLoad: { emit: jest.fn() },
    onSort: { emit: jest.fn() },
    tableService: { onSort: jest.fn() },
    createLazyLoadMetadata: jest.fn(() => ({})),
    hasFilter: jest.fn(() => false),
    _filter: jest.fn(),
    isStateful: jest.fn(() => false),
    saveState: jest.fn(),
    getGroupRowsMeta(this: any) {
      return { field: this.groupRowsBy, order: this.groupRowsByOrder };
    },
    compareValuesOnSort: (v1: any, v2: any, order: number) =>
      order * (v1 > v2 ? 1 : v1 < v2 ? -1 : 0),

    _sortField: undefined as string | null | undefined,
    get sortField() {
      return this._sortField;
    },
    set sortField(v) {
      this._sortField = v;
    },

    _sortOrder: 1,
    get sortOrder() {
      return this._sortOrder;
    },
    set sortOrder(v) {
      this._sortOrder = v;
    },

    _multiSortMeta: undefined as
      | { field: string; order: number }[]
      | null
      | undefined,
    get multiSortMeta() {
      return this._multiSortMeta;
    },
    set multiSortMeta(v) {
      this._multiSortMeta = v;
    },

    _value: rows,
    get value() {
      return this._value;
    },
    set value(v) {
      this._value = v;
    },

    getSortMeta(this: any, field: string) {
      if (this.multiSortMeta && this.multiSortMeta.length) {
        return this.multiSortMeta.find((m: any) => m.field === field) || null;
      }
      return null;
    }
  };

  return mock;
}

describe('TableUnsortDirective', () => {
  let mockTable: ReturnType<typeof buildMockTable>;
  let directive: TableUnsortDirective;

  const freshRows = (): Row[] => [
    { id: 3, name: 'C' },
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
  ];

  beforeEach(() => {
    mockTable = buildMockTable(freshRows());
    directive = new TableUnsortDirective(mockTable as unknown as Table);
  });

  it('should create and replace sort/sortSingle/sortMultiple on the injected table', () => {
    expect(directive).toBeTruthy();
    expect(typeof mockTable.sort).toBe('function');
    expect(typeof (mockTable as any).sortSingle).toBe('function');
    expect(typeof (mockTable as any).sortMultiple).toBe('function');
  });

  describe('resetDefaultSortOrder', () => {
    it('should clear sortIndices', () => {
      mockTable.sort({ field: 'name' });
      expect(directive.sortIndices.length).toBeGreaterThan(0);

      directive.resetDefaultSortOrder();

      expect(directive.sortIndices).toEqual([]);
    });
  });

  describe('single-sort mode', () => {
    it('should sort ascending on first click', () => {
      mockTable.sort({ field: 'name' });

      expect(mockTable.value.map((r) => r.name)).toEqual(['A', 'B', 'C']);
      expect(mockTable.sortField).toBe('name');
      expect(mockTable.sortOrder).toBe(mockTable.defaultSortOrder);
      expect(directive.sortIndices.length).toBe(3);
    });

    it('should toggle to descending on second click of the same field', () => {
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });

      expect(mockTable.value.map((r) => r.name)).toEqual(['C', 'B', 'A']);
      expect(mockTable.sortOrder).toBe(-1);
    });

    it('should restore the original order on a third click of the same field (unsort)', () => {
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });

      expect(mockTable.value).toEqual(freshRows());
      expect(mockTable.sortField).toBeNull();
      expect(mockTable.sortOrder).toBe(mockTable.defaultSortOrder);
      expect(directive.sortIndices).toEqual([]);
    });

    it('should reset order to defaultSortOrder (not toggle) when sorting a different field after unsort', () => {
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });

      mockTable.sort({ field: 'id' });

      expect(mockTable.sortField).toBe('id');
      expect(mockTable.sortOrder).toBe(mockTable.defaultSortOrder);
      expect(mockTable.value.map((r) => r.id)).toEqual([1, 2, 3]);
    });

    it('should call saveState when the table is stateful', () => {
      mockTable.isStateful.mockReturnValue(true);
      mockTable.sort({ field: 'name' });
      expect(mockTable.saveState).toHaveBeenCalled();
    });

    it('should not call saveState when the table is not stateful', () => {
      mockTable.isStateful.mockReturnValue(false);
      mockTable.sort({ field: 'name' });
      expect(mockTable.saveState).not.toHaveBeenCalled();
    });

    it('should reset anchorRowIndex to 0 after every sort', () => {
      mockTable.anchorRowIndex = 5;
      mockTable.sort({ field: 'name' });
      expect(mockTable.anchorRowIndex).toBe(0);
    });

    it('should call _filter when the table has an active filter', () => {
      mockTable.hasFilter.mockReturnValue(true);
      mockTable.sort({ field: 'name' });
      expect(mockTable._filter).toHaveBeenCalled();
    });

    it('should emit sortFunction and skip internal sorting when customSort is true', () => {
      mockTable.customSort = true;
      const original = [...mockTable.value];

      mockTable.sort({ field: 'name' });

      expect(mockTable.sortFunction.emit).toHaveBeenCalledWith({
        data: mockTable.value,
        mode: 'single',
        field: 'name',
        order: mockTable.defaultSortOrder
      });
      expect(mockTable.value).toEqual(original);
    });

    it('should emit onLazyLoad and skip internal sorting when lazy is true', () => {
      mockTable.lazy = true;
      const original = [...mockTable.value];

      mockTable.sort({ field: 'name' });

      expect(mockTable.onLazyLoad.emit).toHaveBeenCalled();
      expect(mockTable.value).toEqual(original);
    });

    it('should emit onSort and tableService.onSort with the expected SortMeta', () => {
      mockTable.sort({ field: 'name' });

      expect(mockTable.onSort.emit).toHaveBeenCalledWith({
        field: 'name',
        order: mockTable.defaultSortOrder
      });
      expect(mockTable.tableService.onSort).toHaveBeenCalledWith({
        field: 'name',
        order: mockTable.defaultSortOrder
      });
    });
  });

  describe('sortSingle grouped-rows delegation', () => {
    it('should delegate to sortMultiple via a synthesized _multiSortMeta when groupRowsBy differs from sortField', () => {
      mockTable.groupRowsBy = 'category';
      mockTable.groupRowsByOrder = 1;
      mockTable.sortField = 'name';
      mockTable.sortOrder = 1;

      (mockTable as any).sortSingle();

      expect(mockTable.multiSortMeta).toEqual([
        { field: 'category', order: 1 },
        { field: 'name', order: 1 }
      ]);
    });
  });

  describe('multiple-sort mode', () => {
    beforeEach(() => {
      mockTable.sortMode = 'multiple';
    });

    it('should push a new entry onto multiSortMeta for a fresh field', () => {
      mockTable.sort({ field: 'name' });

      expect(mockTable.multiSortMeta).toEqual([
        { field: 'name', order: mockTable.defaultSortOrder }
      ]);
      expect(mockTable.value.map((r) => r.name)).toEqual(['A', 'B', 'C']);
    });

    it('should flip an existing entry from order 1 to -1 on a second click', () => {
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });

      expect(mockTable.multiSortMeta).toEqual([{ field: 'name', order: -1 }]);
      expect(mockTable.value.map((r) => r.name)).toEqual(['C', 'B', 'A']);
    });

    it('should remove the entry and restore original order on a third click (unsort)', () => {
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });
      mockTable.sort({ field: 'name' });

      expect(mockTable.multiSortMeta).toEqual([]);
      expect(mockTable.value).toEqual(freshRows());
    });

    it('should sort by multiple fields, using later fields as tie-breakers', () => {
      const rows = [
        { id: 1, a: 'X', b: 2 },
        { id: 2, a: 'Y', b: 1 },
        { id: 3, a: 'X', b: 1 }
      ];
      mockTable = buildMockTable(rows as any);
      mockTable.sortMode = 'multiple';
      directive = new TableUnsortDirective(mockTable as unknown as Table);

      mockTable.sort({ field: 'a' });
      mockTable.sort({ field: 'b' });

      expect((mockTable.value as any[]).map((r) => r.id)).toEqual([3, 1, 2]);
    });

    it('should emit sortFunction and skip internal sorting when customSort is true', () => {
      mockTable.customSort = true;
      const original = [...mockTable.value];

      mockTable.sort({ field: 'name' });

      expect(mockTable.sortFunction.emit).toHaveBeenCalledWith({
        data: mockTable.value,
        mode: 'multiple',
        multiSortMeta: mockTable.multiSortMeta
      });
      expect(mockTable.value).toEqual(original);
    });

    it('should emit onLazyLoad and skip internal sorting when lazy is true', () => {
      mockTable.lazy = true;
      const original = [...mockTable.value];

      mockTable.sort({ field: 'name' });

      expect(mockTable.onLazyLoad.emit).toHaveBeenCalled();
      expect(mockTable.value).toEqual(original);
    });

    it('should prepend the group-rows meta entry when groupRowsBy is set', () => {
      mockTable.groupRowsBy = 'category';
      mockTable.groupRowsByOrder = 1;

      (mockTable as any).sortMultiple();

      expect(mockTable.multiSortMeta).toEqual([
        { field: 'category', order: 1 }
      ]);
    });

    it('should not duplicate the group-rows meta entry when it is already first', () => {
      mockTable.groupRowsBy = 'category';
      mockTable.groupRowsByOrder = 1;
      mockTable.multiSortMeta = [{ field: 'category', order: 1 }];

      (mockTable as any).sortMultiple();

      expect(mockTable.multiSortMeta).toEqual([
        { field: 'category', order: 1 }
      ]);
    });
  });
});
