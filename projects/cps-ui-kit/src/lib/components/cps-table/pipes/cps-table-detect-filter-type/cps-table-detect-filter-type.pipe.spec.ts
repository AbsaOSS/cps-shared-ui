import { CpsTableDetectFilterTypePipe } from './cps-table-detect-filter-type.pipe';

describe('CpsTableDetectFilterTypePipe', () => {
  let pipe: CpsTableDetectFilterTypePipe;

  beforeEach(() => {
    pipe = new CpsTableDetectFilterTypePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('boolean', () => {
    it('should return "boolean" when all values are booleans', () => {
      const data = [{ active: true }, { active: false }, { active: true }];
      expect(pipe.transform(data, 'active')).toBe('boolean');
    });

    it('should return "boolean" for an array of all-true values', () => {
      const data = [{ flag: true }, { flag: true }];
      expect(pipe.transform(data, 'flag')).toBe('boolean');
    });
  });

  describe('number', () => {
    it('should return "number" when all values are numbers', () => {
      const data = [{ age: 1 }, { age: 2 }, { age: 3 }];
      expect(pipe.transform(data, 'age')).toBe('number');
    });

    it('should prefer "number" over "category" when all values are numbers (even fewer than 6)', () => {
      const data = [{ score: 10 }, { score: 20 }, { score: 30 }];
      expect(pipe.transform(data, 'score')).toBe('number');
    });
  });

  describe('date', () => {
    it('should return "date" when all values are Date instances', () => {
      const data = [
        { created: new Date('2024-01-01') },
        { created: new Date('2024-02-01') },
        { created: new Date('2024-03-01') }
      ];
      expect(pipe.transform(data, 'created')).toBe('date');
    });

    it('should prefer "date" over "category" when all values are Dates (even fewer than 6)', () => {
      const data = [{ ts: new Date() }, { ts: new Date() }];
      expect(pipe.transform(data, 'ts')).toBe('date');
    });
  });

  describe('category', () => {
    it('should return "category" when there are fewer than 6 unique string values', () => {
      const data = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'active' },
        { status: 'pending' }
      ];
      expect(pipe.transform(data, 'status')).toBe('category');
    });

    it('should return "category" at exactly 5 unique values', () => {
      const data = ['a', 'b', 'c', 'd', 'e'].map((v) => ({ col: v }));
      expect(pipe.transform(data, 'col')).toBe('category');
    });
  });

  describe('text', () => {
    it('should return "text" when there are 6 or more unique values', () => {
      const data = ['a', 'b', 'c', 'd', 'e', 'f'].map((v) => ({ col: v }));
      expect(pipe.transform(data, 'col')).toBe('text');
    });

    it('should return "text" for many diverse string values', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        name: `name-${i}`
      }));
      expect(pipe.transform(data, 'name')).toBe('text');
    });

    it('should return "text" when values are mixed types with 6+ unique values', () => {
      const data = [
        { val: 1 },
        { val: 'two' },
        { val: true },
        { val: 'four' },
        { val: 5 },
        { val: 'six' }
      ];
      expect(pipe.transform(data, 'val')).toBe('text');
    });
  });

  describe('edge cases', () => {
    it('should return "boolean" for empty data (vacuous truth)', () => {
      expect(pipe.transform([], 'any')).toBe('boolean');
    });

    it('should return "date" for 6+ unique Date values', () => {
      const data = Array.from({ length: 6 }, (_, i) => ({
        ts: new Date(2024, i, 1)
      }));
      expect(pipe.transform(data, 'ts')).toBe('date');
    });

    it('should return "text" when column values are 6+ unique mixed-type items', () => {
      const data = [
        { val: 'a' },
        { val: 'b' },
        { val: 'c' },
        { val: 'd' },
        { val: 'e' },
        { val: 'f' }
      ];
      expect(pipe.transform(data, 'val')).toBe('text');
    });

    it('should use column identity: single-item unique values map to "category"', () => {
      const data = [{ x: 'only' }, { x: 'only' }, { x: 'only' }];
      expect(pipe.transform(data, 'x')).toBe('category');
    });
  });
});
