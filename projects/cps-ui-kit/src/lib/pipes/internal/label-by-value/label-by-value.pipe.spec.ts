import { LabelByValuePipe } from './label-by-value.pipe';

describe('LabelByValuePipe', () => {
  let pipe: LabelByValuePipe;

  const options = [
    { value: { id: 1 }, label: 'A' },
    { value: { id: 2 }, label: 'B' }
  ];

  beforeEach(() => {
    pipe = new LabelByValuePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it("should return the matching option's labelKey value", () => {
    expect(pipe.transform({ id: 2 }, options, 'value', 'label')).toBe('B');
  });

  it('should return an empty string when no option matches', () => {
    expect(pipe.transform({ id: 99 }, options, 'value', 'label')).toBe('');
  });

  it('should use deep equality rather than reference equality for the match', () => {
    expect(pipe.transform({ id: 1 }, options, 'value', 'label')).toBe('A');
  });

  it('should return an empty string when options is an empty array', () => {
    expect(pipe.transform({ id: 1 }, [], 'value', 'label')).toBe('');
  });
});
