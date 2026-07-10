import { CheckOptionSelectedPipe } from './check-option-selected.pipe';

describe('CheckOptionSelectedPipe', () => {
  let pipe: CheckOptionSelectedPipe;

  beforeEach(() => {
    pipe = new CheckOptionSelectedPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('multiple=false, returnObject=false', () => {
    it('should return true when option[optionValue] deep-equals value', () => {
      const option = { value: { id: 1 }, label: 'A' };
      expect(pipe.transform(option, { id: 1 }, false, false, 'value')).toBe(
        true
      );
    });

    it('should return false when option[optionValue] does not deep-equal value', () => {
      const option = { value: { id: 1 }, label: 'A' };
      expect(pipe.transform(option, { id: 2 }, false, false, 'value')).toBe(
        false
      );
    });
  });

  describe('multiple=false, returnObject=true', () => {
    it('should return true when the whole option deep-equals value', () => {
      const option = { value: 1, label: 'A' };
      expect(
        pipe.transform(option, { value: 1, label: 'A' }, false, true, 'value')
      ).toBe(true);
    });

    it('should return false when the whole option does not deep-equal value', () => {
      const option = { value: 1, label: 'A' };
      expect(
        pipe.transform(option, { value: 2, label: 'B' }, false, true, 'value')
      ).toBe(false);
    });
  });

  describe('multiple=true, returnObject=false', () => {
    it('should return true when value contains an item deep-equal to option[optionValue]', () => {
      const option = { value: { id: 1 }, label: 'A' };
      expect(
        pipe.transform(option, [{ id: 2 }, { id: 1 }], true, false, 'value')
      ).toBe(true);
    });

    it('should return false when value does not contain a matching item', () => {
      const option = { value: { id: 1 }, label: 'A' };
      expect(pipe.transform(option, [{ id: 2 }], true, false, 'value')).toBe(
        false
      );
    });

    it('should return false when value is an empty array', () => {
      const option = { value: { id: 1 }, label: 'A' };
      expect(pipe.transform(option, [], true, false, 'value')).toBe(false);
    });
  });

  describe('multiple=true, returnObject=true', () => {
    it('should return true when value contains an item deep-equal to option', () => {
      const option = { value: 1, label: 'A' };
      expect(
        pipe.transform(
          option,
          [
            { value: 2, label: 'B' },
            { value: 1, label: 'A' }
          ],
          true,
          true,
          'value'
        )
      ).toBe(true);
    });

    it('should return false when value does not contain a matching item', () => {
      const option = { value: 1, label: 'A' };
      expect(
        pipe.transform(option, [{ value: 2, label: 'B' }], true, true, 'value')
      ).toBe(false);
    });
  });

  it('should return false rather than throw when value is undefined or null in multiple mode', () => {
    const option = { value: { id: 1 }, label: 'A' };
    expect(pipe.transform(option, undefined, true, false, 'value')).toBe(false);
    expect(pipe.transform(option, null, true, false, 'value')).toBe(false);
  });
});
