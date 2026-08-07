import {
  focusElement,
  generateUniqueId,
  logMissingAriaLabelError
} from './accessibility-utils';

describe('accessibility-utils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateUniqueId', () => {
    it('should return a string prefixed with the default prefix when none is given', () => {
      expect(generateUniqueId()).toMatch(/^cps-[a-z0-9]+-\d+$/);
    });

    it('should return a string prefixed with the given prefix', () => {
      expect(generateUniqueId('custom')).toMatch(/^custom-[a-z0-9]+-\d+$/);
    });

    it('should return a different value on each call', () => {
      const first = generateUniqueId();
      const second = generateUniqueId();
      expect(first).not.toBe(second);
    });
  });

  describe('focusElement', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not call focus synchronously', () => {
      const element = { focus: jest.fn() } as unknown as HTMLElement;
      focusElement(element);
      expect(element.focus).not.toHaveBeenCalled();
    });

    it('should call focus after the timer fires', () => {
      const element = { focus: jest.fn() } as unknown as HTMLElement;
      focusElement(element);
      jest.runAllTimers();
      expect(element.focus).toHaveBeenCalledTimes(1);
    });

    it('should not throw and not schedule a timer when element is undefined', () => {
      const spy = jest.spyOn(window, 'setTimeout');
      expect(() => focusElement(undefined)).not.toThrow();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('logMissingAriaLabelError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log an error when both label and ariaLabel are omitted', () => {
      logMissingAriaLabelError('CpsTestComponent');
      expect(console.error).toHaveBeenCalledWith(
        'CpsTestComponent: unlabeled component must have an ariaLabel for accessibility.'
      );
    });

    it('should log an error when both label and ariaLabel are whitespace-only', () => {
      logMissingAriaLabelError('CpsTestComponent', '  ', '  ');
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should not log when label is a non-empty string', () => {
      logMissingAriaLabelError('CpsTestComponent', 'Some label');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not log when ariaLabel is a non-empty string', () => {
      logMissingAriaLabelError(
        'CpsTestComponent',
        undefined,
        'Some aria label'
      );
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
