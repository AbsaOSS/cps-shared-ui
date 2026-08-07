import { CombineLabelsPipe } from './combine-labels.pipe';

describe('CombineLabelsPipe', () => {
  let pipe: CombineLabelsPipe;

  const options = [
    { value: 1, label: 'A' },
    { value: 2, label: 'B' },
    { value: 3, label: 'C' }
  ];

  beforeEach(() => {
    pipe = new CombineLabelsPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should map values to labels via options and join with ", " when returnObject is false', () => {
    expect(pipe.transform([1, 3], options, 'value', 'label', false)).toBe(
      'A, C'
    );
  });

  it('should map unmatched values to an empty string segment when returnObject is false', () => {
    expect(pipe.transform([1, 99], options, 'value', 'label', false)).toBe(
      'A, '
    );
  });

  it('should read labelKey directly off each item when returnObject is true', () => {
    const values = [
      { value: 1, label: 'A' },
      { value: 2, label: 'B' }
    ];
    expect(pipe.transform(values, options, 'value', 'label', true)).toBe(
      'A, B'
    );
  });

  it('should return an empty string for an empty values array', () => {
    expect(pipe.transform([], options, 'value', 'label', false)).toBe('');
  });

  it('should return just the one label for a single value with no stray separator', () => {
    expect(pipe.transform([2], options, 'value', 'label', false)).toBe('B');
  });
});
