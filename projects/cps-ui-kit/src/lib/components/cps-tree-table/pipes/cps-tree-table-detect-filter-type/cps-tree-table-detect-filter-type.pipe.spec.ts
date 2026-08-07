import { CpsTreeTableDetectFilterTypePipe } from './cps-tree-table-detect-filter-type.pipe';

describe('CpsTreeTableDetectFilterTypePipe', () => {
  let pipe: CpsTreeTableDetectFilterTypePipe;

  beforeEach(() => {
    pipe = new CpsTreeTableDetectFilterTypePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('boolean', () => {
    it('should return "boolean" when all values are booleans', () => {
      const nodes = [
        { data: { active: true } },
        { data: { active: false } },
        { data: { active: true } }
      ];
      expect(pipe.transform(nodes, 'active')).toBe('boolean');
    });

    it('should return "boolean" for an array of all-true values', () => {
      const nodes = [{ data: { flag: true } }, { data: { flag: true } }];
      expect(pipe.transform(nodes, 'flag')).toBe('boolean');
    });
  });

  describe('number', () => {
    it('should return "number" when all values are numbers', () => {
      const nodes = [
        { data: { age: 1 } },
        { data: { age: 2 } },
        { data: { age: 3 } }
      ];
      expect(pipe.transform(nodes, 'age')).toBe('number');
    });

    it('should prefer "number" over "category" when all values are numbers (even fewer than 6)', () => {
      const nodes = [{ data: { score: 10 } }, { data: { score: 20 } }];
      expect(pipe.transform(nodes, 'score')).toBe('number');
    });
  });

  describe('date', () => {
    it('should return "date" when all values are Date instances', () => {
      const nodes = [
        { data: { created: new Date('2024-01-01') } },
        { data: { created: new Date('2024-02-01') } },
        { data: { created: new Date('2024-03-01') } }
      ];
      expect(pipe.transform(nodes, 'created')).toBe('date');
    });

    it('should prefer "date" over "category" when all values are Dates (even fewer than 6)', () => {
      const nodes = [
        { data: { ts: new Date() } },
        { data: { ts: new Date() } }
      ];
      expect(pipe.transform(nodes, 'ts')).toBe('date');
    });

    it('should return "date" for 6+ unique Date values', () => {
      const nodes = Array.from({ length: 6 }, (_, i) => ({
        data: { ts: new Date(2024, i, 1) }
      }));
      expect(pipe.transform(nodes, 'ts')).toBe('date');
    });
  });

  describe('category', () => {
    it('should return "category" when there are fewer than 6 unique string values', () => {
      const nodes = [
        { data: { status: 'active' } },
        { data: { status: 'inactive' } },
        { data: { status: 'active' } },
        { data: { status: 'pending' } }
      ];
      expect(pipe.transform(nodes, 'status')).toBe('category');
    });

    it('should return "category" at exactly 5 unique values', () => {
      const nodes = ['a', 'b', 'c', 'd', 'e'].map((v) => ({
        data: { col: v }
      }));
      expect(pipe.transform(nodes, 'col')).toBe('category');
    });
  });

  describe('text', () => {
    it('should return "text" when there are 6 or more unique string values', () => {
      const nodes = ['a', 'b', 'c', 'd', 'e', 'f'].map((v) => ({
        data: { col: v }
      }));
      expect(pipe.transform(nodes, 'col')).toBe('text');
    });

    it('should return "text" for many diverse string values', () => {
      const nodes = Array.from({ length: 10 }, (_, i) => ({
        data: { name: `name-${i}` }
      }));
      expect(pipe.transform(nodes, 'name')).toBe('text');
    });

    it('should return "text" when values are mixed types with 6+ unique values', () => {
      const nodes = [
        { data: { val: 1 } },
        { data: { val: 'two' } },
        { data: { val: true } },
        { data: { val: 'four' } },
        { data: { val: 5 } },
        { data: { val: 'six' } }
      ];
      expect(pipe.transform(nodes, 'val')).toBe('text');
    });
  });

  describe('edge cases', () => {
    it('should return "boolean" for empty nodes array', () => {
      expect(pipe.transform([], 'any')).toBe('boolean');
    });

    it('should return "text" when column values include 6+ unique mixed-type items', () => {
      const nodes = [
        { data: { val: 'alpha' } },
        { data: { val: 'beta' } },
        { data: { val: 'gamma' } },
        { data: { val: 'delta' } },
        { data: { val: 'epsilon' } },
        { data: { val: 'zeta' } }
      ];
      expect(pipe.transform(nodes, 'val')).toBe('text');
    });
  });
});
