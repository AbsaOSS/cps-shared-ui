import { uwtIsDebugEnabled } from './uwt-debug-flag.util';

describe('uwtIsDebugEnabled', () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should be disabled by default when the key is absent', () => {
    expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
    expect(uwtIsDebugEnabled('debugScenario')).toBe(false);
    expect(uwtIsDebugEnabled('debugBI')).toBe(false);
  });

  it('should be enabled by the string "true"', () => {
    localStorage.setItem('debugLogger', 'true');
    expect(uwtIsDebugEnabled('debugLogger')).toBe(true);
  });

  it('should be enabled by the string "1"', () => {
    localStorage.setItem('debugScenario', '1');
    expect(uwtIsDebugEnabled('debugScenario')).toBe(true);
  });

  it('should accept surrounding whitespace and mixed casing', () => {
    localStorage.setItem('debugBI', '  TRUE ');
    expect(uwtIsDebugEnabled('debugBI')).toBe(true);
  });

  it.each(['false', '0', 'yes', 'on', '', 'null', 'undefined', '2'])(
    'should stay disabled for the invalid value "%s"',
    (value) => {
      localStorage.setItem('debugLogger', value);
      expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
    }
  );

  it('should stay disabled when localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: access denied');
    });
    expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
  });

  it('should read the flag on every call so DevTools toggles take effect', () => {
    expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
    localStorage.setItem('debugLogger', 'true');
    expect(uwtIsDebugEnabled('debugLogger')).toBe(true);
    localStorage.removeItem('debugLogger');
    expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
  });

  describe('scoped by name', () => {
    it('should enable only a matching name', () => {
      localStorage.setItem('debugLogger', 'checkout');

      expect(uwtIsDebugEnabled('debugLogger', 'checkout')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger', 'admin')).toBe(false);
    });

    it('should accept a comma-separated list', () => {
      localStorage.setItem('debugLogger', 'checkout,admin');

      expect(uwtIsDebugEnabled('debugLogger', 'checkout')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger', 'admin')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger', 'reports')).toBe(false);
    });

    it('should ignore whitespace and case around each entry', () => {
      localStorage.setItem('debugLogger', ' Checkout , ADMIN ');

      expect(uwtIsDebugEnabled('debugLogger', 'checkout')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger', 'admin')).toBe(true);
    });

    it('should read a list as disabled for a caller that asks unqualified', () => {
      localStorage.setItem('debugLogger', 'checkout');

      expect(uwtIsDebugEnabled('debugLogger')).toBe(false);
    });

    it('should enable every name when the value is "true"', () => {
      localStorage.setItem('debugLogger', 'true');

      expect(uwtIsDebugEnabled('debugLogger', 'checkout')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger', 'anything')).toBe(true);
      expect(uwtIsDebugEnabled('debugLogger')).toBe(true);
    });

    it('should stay disabled for a name when the flag is unset', () => {
      expect(uwtIsDebugEnabled('debugLogger', 'checkout')).toBe(false);
    });
  });
});
