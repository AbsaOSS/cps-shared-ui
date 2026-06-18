import { CpsPaginatePipe } from './cps-paginate.pipe';

describe('CpsPaginatePipe', () => {
  let pipe: CpsPaginatePipe;

  beforeEach(() => {
    pipe = new CpsPaginatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return [] when items is null', () => {
    expect(pipe.transform(null as any, { first: 0, rows: 5 })).toEqual([]);
  });

  it('should return [] when items is undefined', () => {
    expect(pipe.transform(undefined as any, { first: 0, rows: 5 })).toEqual([]);
  });

  it('should return an empty array when items is empty', () => {
    const result = pipe.transform([], { first: 0, rows: 5 });
    expect(result).toEqual([]);
  });

  it('should return the first page of items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(pipe.transform(items, { first: 0, rows: 5 })).toEqual([
      1, 2, 3, 4, 5
    ]);
  });

  it('should return the second page of items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(pipe.transform(items, { first: 5, rows: 5 })).toEqual([
      6, 7, 8, 9, 10
    ]);
  });

  it('should return a partial page when remaining items are fewer than rows', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(pipe.transform(items, { first: 5, rows: 5 })).toEqual([6, 7]);
  });

  it('should default first to 0 when config.first is 0 (falsy)', () => {
    const items = [1, 2, 3, 4, 5];
    expect(pipe.transform(items, { first: 0, rows: 3 })).toEqual([1, 2, 3]);
  });

  it('should default rows to 5 when config.rows is 0 (falsy)', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(pipe.transform(items, { first: 0, rows: 0 })).toEqual([
      1, 2, 3, 4, 5
    ]);
  });

  it('should handle rows larger than the total number of items', () => {
    const items = [1, 2, 3];
    expect(pipe.transform(items, { first: 0, rows: 10 })).toEqual([1, 2, 3]);
  });

  it('should return [] when first is beyond the end of the array', () => {
    const items = [1, 2, 3, 4, 5];
    expect(pipe.transform(items, { first: 10, rows: 5 })).toEqual([]);
  });

  it('should work with rows of 1', () => {
    const items = [10, 20, 30];
    expect(pipe.transform(items, { first: 1, rows: 1 })).toEqual([20]);
  });

  it('should work with object items', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(pipe.transform(items, { first: 2, rows: 2 })).toEqual([
      { id: 3 },
      { id: 4 }
    ]);
  });
});
