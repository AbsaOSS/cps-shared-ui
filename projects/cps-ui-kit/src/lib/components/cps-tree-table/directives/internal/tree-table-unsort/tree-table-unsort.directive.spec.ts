import { TreeTable } from 'primeng/treetable';
import { TreeTableUnsortDirective } from './tree-table-unsort.directive';

type Node = {
  data: Record<string, any>;
  children?: Node[];
  expanded?: boolean;
  partialSelected?: boolean;
  _defaultSortOrder?: number;
  _idx?: number;
};

const makeNode = (
  id: number,
  name: string,
  _defaultSortOrder: number,
  children?: Node[]
): Node => ({ data: { id, name }, _defaultSortOrder, children });

const freshNodes = (): Node[] => [
  makeNode(3, 'C', 0),
  makeNode(1, 'A', 1),
  makeNode(2, 'B', 2)
];

function buildMockTreeTable(nodes: Node[] = []) {
  const mock = {
    // Overwritten by TreeTableUnsortDirective's constructor; declared here
    // so calls to mockTreeTable.sort(...) below type-check.
    sort: undefined as unknown as (event: { field: string }) => void,
    sortMode: 'single' as 'single' | 'multiple',
    defaultSortOrder: 1,
    lazy: false,
    customSort: false,
    scrollable: false,
    paginator: false,
    totalRecords: 0,
    first: 5,
    filters: {} as Record<string, any>,
    filterMode: undefined as 'strict' | undefined,
    filterService: { filters: {} as Record<string, any> },
    columns: undefined as any,
    globalFilterFields: undefined as any,
    filteredNodes: null as Node[] | null,
    value: nodes as Node[] | undefined,

    sortFunction: { emit: jest.fn() },
    onLazyLoad: { emit: jest.fn() },
    onSort: { emit: jest.fn() },
    onFilter: { emit: jest.fn() },
    tableService: { onSort: jest.fn(), onUIUpdate: jest.fn() },
    createLazyLoadMetadata: jest.fn(() => ({})),
    hasFilter: jest.fn(() => false),
    isFilterMatched: jest.fn((_node?: any, _params?: any) => false),
    updateSerializedValue: jest.fn(),
    resetScrollTop: jest.fn(),

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

    getSortMeta(field: string) {
      if (this.multiSortMeta && this.multiSortMeta.length) {
        return this.multiSortMeta.find((m) => m.field === field) || null;
      }
      return null;
    },

    // Real (unpatched) TreeTable prototype behavior the directive relies on.
    sortSingle() {
      if (this.sortField && this.sortOrder) {
        if (this.lazy) {
          this.onLazyLoad.emit(this.createLazyLoadMetadata());
        } else if (this.value) {
          (this as any).sortNodes(this.value);
          if (this.hasFilter()) (this as any)._filter();
        }
        const sortMeta = { field: this.sortField, order: this.sortOrder };
        this.onSort.emit(sortMeta);
        this.tableService.onSort(sortMeta);
        this.updateSerializedValue();
      }
    },
    sortMultiple() {
      if (this.multiSortMeta) {
        if (this.lazy) {
          this.onLazyLoad.emit(this.createLazyLoadMetadata());
        } else if (this.value) {
          (this as any).sortMultipleNodes(this.value);
          if (this.hasFilter()) (this as any)._filter();
        }
        this.onSort.emit({ multisortmeta: this.multiSortMeta });
        this.updateSerializedValue();
        this.tableService.onSort(this.multiSortMeta);
      }
    }
  };

  return mock;
}

describe('TreeTableUnsortDirective', () => {
  let mockTreeTable: ReturnType<typeof buildMockTreeTable>;
  let directive: TreeTableUnsortDirective;

  beforeEach(() => {
    mockTreeTable = buildMockTreeTable(freshNodes());
    directive = new TreeTableUnsortDirective(
      mockTreeTable as unknown as TreeTable
    );
  });

  it('should create and patch sort, sortNodes, sortMultipleNodes, multisortField, _filter and findFilteredNodes', () => {
    expect(directive).toBeTruthy();
    expect(typeof mockTreeTable.sort).toBe('function');
    expect(typeof (mockTreeTable as any).sortNodes).toBe('function');
    expect(typeof (mockTreeTable as any).sortMultipleNodes).toBe('function');
    expect(typeof (mockTreeTable as any).multisortField).toBe('function');
    expect(typeof (mockTreeTable as any)._filter).toBe('function');
    expect(typeof (mockTreeTable as any).findFilteredNodes).toBe('function');
  });

  describe('sort() - single mode', () => {
    it('should sort ascending on first click', () => {
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.value!.map((n) => n.data.name)).toEqual([
        'A',
        'B',
        'C'
      ]);
      expect(mockTreeTable.sortField).toBe('name');
      expect(mockTreeTable.sortOrder).toBe(mockTreeTable.defaultSortOrder);
    });

    it('should toggle to descending on second click of the same field', () => {
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.value!.map((n) => n.data.name)).toEqual([
        'C',
        'B',
        'A'
      ]);
      expect(mockTreeTable.sortOrder).toBe(-1);
    });

    it('should rewrite the field to the _defaultSortOrder sentinel and restore original order on a third click', () => {
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.sortField).toBe('_defaultSortOrder');
      expect(mockTreeTable.sortOrder).toBe(mockTreeTable.defaultSortOrder);
      expect(mockTreeTable.value!.map((n) => n.data.id)).toEqual([3, 1, 2]);
    });
  });

  describe('sort() - multiple mode', () => {
    beforeEach(() => {
      mockTreeTable.sortMode = 'multiple';
    });

    it('should push a new entry onto multiSortMeta for a fresh field and sort ascending', () => {
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.multiSortMeta).toEqual([
        { field: 'name', order: mockTreeTable.defaultSortOrder }
      ]);
      expect(mockTreeTable.value!.map((n) => n.data.name)).toEqual([
        'A',
        'B',
        'C'
      ]);
    });

    it('should flip an existing entry from order 1 to -1 on a second click', () => {
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.multiSortMeta).toEqual([
        { field: 'name', order: -1 }
      ]);
      expect(mockTreeTable.value!.map((n) => n.data.name)).toEqual([
        'C',
        'B',
        'A'
      ]);
    });

    it('should remove the entry and restore original order on a third click (unsort)', () => {
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });
      mockTreeTable.sort({ field: 'name' });

      expect(mockTreeTable.multiSortMeta).toEqual([]);
      expect(mockTreeTable.value!.map((n) => n.data.id)).toEqual([3, 1, 2]);
    });

    it('should sort by multiple fields, using later fields as tie-breakers', () => {
      const nodes: Node[] = [
        { data: { id: 1, a: 'X', b: 2 }, _defaultSortOrder: 0 },
        { data: { id: 2, a: 'Y', b: 1 }, _defaultSortOrder: 1 },
        { data: { id: 3, a: 'X', b: 1 }, _defaultSortOrder: 2 }
      ];
      mockTreeTable = buildMockTreeTable(nodes);
      mockTreeTable.sortMode = 'multiple';
      directive = new TreeTableUnsortDirective(
        mockTreeTable as unknown as TreeTable
      );

      mockTreeTable.sort({ field: 'a' });
      mockTreeTable.sort({ field: 'b' });

      expect(mockTreeTable.value!.map((n) => n.data.id)).toEqual([3, 1, 2]);
    });
  });

  describe('sortNodes', () => {
    it('should be a no-op for an empty or undefined array', () => {
      expect(() => (mockTreeTable as any).sortNodes([])).not.toThrow();
      expect(() => (mockTreeTable as any).sortNodes(undefined)).not.toThrow();
    });

    it('should call _syncNodesParams(filteredNodes, nodes) before sorting', () => {
      const nodes = freshNodes();
      mockTreeTable.filteredNodes = [{ ...nodes[0], _idx: 0, expanded: true }];

      (mockTreeTable as any).sortNodes(nodes);

      const restored = nodes.find((n) => n.data.id === 3);
      expect(restored?.expanded).toBe(true);
    });

    it('should sort strings using localeCompare with numeric option', () => {
      const nodes: Node[] = [
        { data: { label: 'item10' }, _defaultSortOrder: 0 },
        { data: { label: 'item2' }, _defaultSortOrder: 1 }
      ];
      mockTreeTable.sortField = 'label';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes.map((n) => n.data.label)).toEqual(['item2', 'item10']);
    });

    it('should sort numeric field values with </>', () => {
      const nodes: Node[] = [
        { data: { count: 30 }, _defaultSortOrder: 0 },
        { data: { count: 10 }, _defaultSortOrder: 1 },
        { data: { count: 20 }, _defaultSortOrder: 2 }
      ];
      mockTreeTable.sortField = 'count';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes.map((n) => n.data.count)).toEqual([10, 20, 30]);
    });

    it('should sort null/undefined field values to a consistent position (before non-null values, ascending)', () => {
      const nodes: Node[] = [
        { data: { label: 'B' }, _defaultSortOrder: 0 },
        { data: { label: null }, _defaultSortOrder: 1 },
        { data: { label: 'A' }, _defaultSortOrder: 2 }
      ];
      mockTreeTable.sortField = 'label';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes.map((n) => n.data.label)).toEqual([null, 'A', 'B']);
    });

    it('should sort by _defaultSortOrder when sortField is the unsort sentinel', () => {
      const nodes = freshNodes();
      mockTreeTable.sortField = '_defaultSortOrder';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes.map((n) => n.data.id)).toEqual([3, 1, 2]);
    });

    it('should multiply the comparison by sortOrder for descending sort', () => {
      const nodes = freshNodes();
      mockTreeTable.sortField = 'name';
      mockTreeTable.sortOrder = -1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes.map((n) => n.data.name)).toEqual(['C', 'B', 'A']);
    });

    it('should recurse into node.children', () => {
      const child1 = makeNode(20, 'B', 0);
      const child2 = makeNode(10, 'A', 1);
      const nodes: Node[] = [
        { data: { id: 1, name: 'Parent' }, children: [child1, child2] }
      ];
      mockTreeTable.sortField = 'name';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(nodes[0].children!.map((n) => n.data.name)).toEqual(['A', 'B']);
    });

    it('should emit sortFunction and skip default sorting when customSort is true', () => {
      const nodes = freshNodes();
      const original = [...nodes];
      mockTreeTable.customSort = true;
      mockTreeTable.sortField = 'name';
      mockTreeTable.sortOrder = 1;

      (mockTreeTable as any).sortNodes(nodes);

      expect(mockTreeTable.sortFunction.emit).toHaveBeenCalledWith({
        data: nodes,
        mode: 'single',
        field: 'name',
        order: 1
      });
      expect(nodes).toEqual(original);
    });
  });

  describe('sortMultipleNodes', () => {
    it('should be a no-op for an empty or undefined array', () => {
      expect(() => (mockTreeTable as any).sortMultipleNodes([])).not.toThrow();
      expect(() =>
        (mockTreeTable as any).sortMultipleNodes(undefined)
      ).not.toThrow();
    });

    it('should call _syncNodesParams(filteredNodes, nodes) before sorting', () => {
      const nodes = freshNodes();
      mockTreeTable.filteredNodes = [{ ...nodes[0], _idx: 0, expanded: true }];
      mockTreeTable.multiSortMeta = [{ field: 'name', order: 1 }];

      (mockTreeTable as any).sortMultipleNodes(nodes);

      const restored = nodes.find((n) => n.data.id === 3);
      expect(restored?.expanded).toBe(true);
    });

    it('should recurse into node.children', () => {
      const child1 = makeNode(20, 'B', 0);
      const child2 = makeNode(10, 'A', 1);
      const nodes: Node[] = [
        { data: { id: 1, name: 'Parent' }, children: [child1, child2] }
      ];
      mockTreeTable.multiSortMeta = [{ field: 'name', order: 1 }];

      (mockTreeTable as any).sortMultipleNodes(nodes);

      expect(nodes[0].children!.map((n) => n.data.name)).toEqual(['A', 'B']);
    });

    it('should emit sortFunction and skip default sorting when customSort is true', () => {
      const nodes = freshNodes();
      const original = [...nodes];
      mockTreeTable.customSort = true;
      mockTreeTable.multiSortMeta = [{ field: 'name', order: 1 }];

      (mockTreeTable as any).sortMultipleNodes(nodes);

      expect(mockTreeTable.sortFunction.emit).toHaveBeenCalledWith({
        data: mockTreeTable.value,
        mode: 'single',
        multiSortMeta: mockTreeTable.multiSortMeta
      });
      expect(nodes).toEqual(original);
    });
  });

  describe('multisortField', () => {
    it('should return 0 when pTreeTable.multiSortMeta is empty, even if a non-empty meta array is passed', () => {
      mockTreeTable.multiSortMeta = undefined;
      const n1 = makeNode(1, 'A', 0);
      const n2 = makeNode(2, 'B', 1);

      const result = (mockTreeTable as any).multisortField(
        n1,
        n2,
        [{ field: 'name', order: 1 }],
        0
      );

      expect(result).toBe(0);
    });

    it('should return 0 when multiSortMeta[index] is empty', () => {
      mockTreeTable.multiSortMeta = [{ field: 'name', order: 1 }];
      const n1 = makeNode(1, 'A', 0);
      const n2 = makeNode(2, 'B', 1);

      const result = (mockTreeTable as any).multisortField(
        n1,
        n2,
        [{ field: 'name', order: 1 }],
        5
      );

      expect(result).toBe(0);
    });

    it('should compare via _defaultSortOrder for the unsort sentinel field', () => {
      const meta = [{ field: '_defaultSortOrder', order: 1 }];
      mockTreeTable.multiSortMeta = meta;
      const n1 = makeNode(1, 'A', 5);
      const n2 = makeNode(2, 'B', 2);

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBeGreaterThan(0);
    });

    it('should compare strings via localeCompare multiplied by order', () => {
      const meta = [{ field: 'name', order: -1 }];
      mockTreeTable.multiSortMeta = meta;
      const n1 = makeNode(1, 'A', 0);
      const n2 = makeNode(2, 'B', 1);

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBeGreaterThan(0);
    });

    it('should compare non-string values with </> multiplied by order', () => {
      const meta = [{ field: 'count', order: 1 }];
      mockTreeTable.multiSortMeta = meta;
      const n1 = { data: { count: 5 } } as Node;
      const n2 = { data: { count: 10 } } as Node;

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBe(-1);
    });

    it('should recurse to index + 1 on a tie', () => {
      const meta = [
        { field: 'group', order: 1 },
        { field: 'name', order: 1 }
      ];
      mockTreeTable.multiSortMeta = meta;
      const n1 = { data: { group: 'X', name: 'B' } } as Node;
      const n2 = { data: { group: 'X', name: 'A' } } as Node;

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 on a tie at the last meta entry', () => {
      const meta = [{ field: 'group', order: 1 }];
      mockTreeTable.multiSortMeta = meta;
      const n1 = { data: { group: 'X' } } as Node;
      const n2 = { data: { group: 'X' } } as Node;

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBe(0);
    });

    it('should sort null/undefined values to a consistent end', () => {
      const meta = [{ field: 'count', order: 1 }];
      mockTreeTable.multiSortMeta = meta;
      const n1 = { data: { count: null } } as Node;
      const n2 = { data: { count: 5 } } as Node;

      const result = (mockTreeTable as any).multisortField(n1, n2, meta, 0);

      expect(result).toBe(-1);
    });
  });

  describe('_filter', () => {
    it('should emit onLazyLoad and skip local filtering when lazy is true', () => {
      mockTreeTable.lazy = true;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.onLazyLoad.emit).toHaveBeenCalled();
    });

    it('should return early without emitting when value is falsy', () => {
      mockTreeTable.value = undefined;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.onFilter.emit).not.toHaveBeenCalled();
    });

    it('should clear filteredNodes and set totalRecords when there is no active filter and paginator is on', () => {
      mockTreeTable.hasFilter.mockReturnValue(false);
      mockTreeTable.paginator = true;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.filteredNodes).toBeNull();
      expect(mockTreeTable.totalRecords).toBe(mockTreeTable.value!.length);
    });

    it('should throw when a global filter is configured without columns or globalFilterFields', () => {
      mockTreeTable.hasFilter.mockReturnValue(true);
      mockTreeTable.filters = { global: { value: 'x', matchMode: 'contains' } };
      mockTreeTable.columns = undefined;
      mockTreeTable.globalFilterFields = undefined;

      expect(() => (mockTreeTable as any)._filter()).toThrow(
        'Global filtering requires dynamic columns or globalFilterFields to be defined.'
      );
    });

    it('should tag matching nodes with _idx when a local filter is active', () => {
      mockTreeTable.hasFilter.mockReturnValue(true);
      mockTreeTable.filters = { name: { value: 'A', matchMode: 'contains' } };
      mockTreeTable.isFilterMatched.mockImplementation(
        (node: any) => node.data.name === 'A'
      );

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.filteredNodes).toHaveLength(1);
      expect(mockTreeTable.filteredNodes![0].data.name).toBe('A');
      expect((mockTreeTable.filteredNodes![0] as any)._idx).toBe(1);
    });

    it('should not call findFilteredNodes when isFilterMatched already matched in non-strict mode', () => {
      mockTreeTable.hasFilter.mockReturnValue(true);
      mockTreeTable.filterMode = undefined;
      mockTreeTable.filters = { name: { value: 'A', matchMode: 'contains' } };
      mockTreeTable.isFilterMatched.mockReturnValue(true);
      const findFilteredNodesSpy = jest.fn().mockReturnValue(false);
      (mockTreeTable as any).findFilteredNodes = findFilteredNodesSpy;

      (mockTreeTable as any)._filter();

      expect(findFilteredNodesSpy).not.toHaveBeenCalled();
    });

    it('should not call isFilterMatched when findFilteredNodes already matched in strict mode', () => {
      mockTreeTable.hasFilter.mockReturnValue(true);
      mockTreeTable.filterMode = 'strict';
      mockTreeTable.filters = { name: { value: 'A', matchMode: 'contains' } };
      (mockTreeTable as any).findFilteredNodes = jest
        .fn()
        .mockReturnValue(true);

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.isFilterMatched).not.toHaveBeenCalled();
    });

    it('should always reset first, emit onFilter and update the table service and serialized value', () => {
      mockTreeTable.first = 7;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.first).toBe(0);
      expect(mockTreeTable.onFilter.emit).toHaveBeenCalledWith({
        filters: mockTreeTable.filters,
        filteredValue: mockTreeTable.value
      });
      expect(mockTreeTable.tableService.onUIUpdate).toHaveBeenCalledWith(
        mockTreeTable.value
      );
      expect(mockTreeTable.updateSerializedValue).toHaveBeenCalled();
    });

    it('should call resetScrollTop when scrollable is true', () => {
      mockTreeTable.scrollable = true;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.resetScrollTop).toHaveBeenCalled();
    });

    it('should not call resetScrollTop when scrollable is false', () => {
      mockTreeTable.scrollable = false;

      (mockTreeTable as any)._filter();

      expect(mockTreeTable.resetScrollTop).not.toHaveBeenCalled();
    });
  });

  describe('findFilteredNodes', () => {
    it('should return undefined for a falsy node', () => {
      const result = (mockTreeTable as any).findFilteredNodes(null, {});
      expect(result).toBeUndefined();
    });

    it('should return true and replace children with only the matching ones, tagged with _idx', () => {
      mockTreeTable.isFilterMatched.mockImplementation(
        (node: any) => node.data.name === 'Match'
      );
      const node: Node = {
        data: { id: 1 },
        children: [{ data: { name: 'NoMatch' } }, { data: { name: 'Match' } }]
      };

      const result = (mockTreeTable as any).findFilteredNodes(node, {});

      expect(result).toBe(true);
      expect(node.children).toHaveLength(1);
      expect(node.children![0].data.name).toBe('Match');
      expect((node.children![0] as any)._idx).toBe(1);
    });

    it('should return undefined and empty node.children when no children match', () => {
      mockTreeTable.isFilterMatched.mockReturnValue(false);
      const node: Node = {
        data: { id: 1 },
        children: [{ data: { name: 'NoMatch' } }]
      };

      const result = (mockTreeTable as any).findFilteredNodes(node, {});

      expect(result).toBeUndefined();
      expect(node.children).toEqual([]);
    });

    it('should leave node.children untouched when the node has no children property', () => {
      const node: Node = { data: { id: 1 } };

      const result = (mockTreeTable as any).findFilteredNodes(node, {});

      expect(result).toBeUndefined();
      expect(node.children).toBeUndefined();
    });
  });

  describe('_syncNodesParams', () => {
    it('should be a no-op when from or to is falsy', () => {
      expect(() =>
        (directive as any)._syncNodesParams(null, freshNodes())
      ).not.toThrow();
      expect(() =>
        (directive as any)._syncNodesParams(freshNodes(), null)
      ).not.toThrow();
    });

    it('should copy expanded/partialSelected from a matched source node and delete _idx from it', () => {
      const to = freshNodes();
      const from: Node[] = [
        { ...to[0], _idx: 0, expanded: true, partialSelected: true }
      ];

      (directive as any)._syncNodesParams(from, to);

      expect(to[0].expanded).toBe(true);
      expect(to[0].partialSelected).toBe(true);
      expect(from[0]._idx).toBeUndefined();
    });

    it('should recurse into children when both source and target have them', () => {
      const toChild = makeNode(10, 'Child', 0);
      const to: Node[] = [
        { data: { id: 1, name: 'Parent' }, children: [toChild] }
      ];
      const fromChild = { ...toChild, _idx: 0, expanded: true };
      const from: Node[] = [
        { data: { id: 1, name: 'Parent' }, _idx: 0, children: [fromChild] }
      ];

      (directive as any)._syncNodesParams(from, to);

      expect(to[0].children![0].expanded).toBe(true);
    });

    it('should skip entries in from without a numeric _idx', () => {
      const to = freshNodes();
      const from: Node[] = [{ ...to[0], expanded: true }];

      (directive as any)._syncNodesParams(from, to);

      expect(to[0].expanded).toBeUndefined();
    });
  });
});
