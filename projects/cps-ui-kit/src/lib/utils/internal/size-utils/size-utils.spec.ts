import { convertSize, parseSize } from './size-utils';

describe('size-utils', () => {
  describe('convertSize', () => {
    it('should return empty string for null or undefined', () => {
      expect(convertSize(null)).toBe('');
      expect(convertSize(undefined)).toBe('');
    });

    it('should return empty string for empty or whitespace-only input', () => {
      expect(convertSize('')).toBe('');
      expect(convertSize('   ')).toBe('');
    });

    it('should append px to a bare numeric input', () => {
      expect(convertSize(10)).toBe('10px');
      expect(convertSize(0)).toBe('0px');
      expect(convertSize(-5)).toBe('-5px');
    });

    it('should append px to a numeric-looking string, trimming whitespace', () => {
      expect(convertSize('10')).toBe('10px');
      expect(convertSize('10.5')).toBe('10.5px');
      expect(convertSize(' 10 ')).toBe('10px');
    });

    it('should return supported unit values unchanged', () => {
      expect(convertSize('10px')).toBe('10px');
      expect(convertSize('1.5rem')).toBe('1.5rem');
      expect(convertSize('2em')).toBe('2em');
      expect(convertSize('50%')).toBe('50%');
      expect(convertSize('10vw')).toBe('10vw');
    });

    it('should return keyword values unchanged, case-insensitively', () => {
      expect(convertSize('auto')).toBe('auto');
      expect(convertSize('AUTO')).toBe('AUTO');
      expect(convertSize('inherit')).toBe('inherit');
      expect(convertSize('none')).toBe('none');
    });

    it('should return function-call values unchanged', () => {
      expect(convertSize('calc(100% - 10px)')).toBe('calc(100% - 10px)');
      expect(convertSize('var(--x)')).toBe('var(--x)');
      expect(convertSize('min(10px, 5%)')).toBe('min(10px, 5%)');
    });

    it('should return empty string for invalid or unrecognized values', () => {
      expect(convertSize('banana')).toBe('');
      expect(convertSize('10xyz')).toBe('');
    });
  });

  describe('parseSize', () => {
    it('should parse px values', () => {
      expect(parseSize('10px')).toEqual({ value: 10, unit: 'px' });
    });

    it('should parse rem values', () => {
      expect(parseSize('1.5rem')).toEqual({ value: 1.5, unit: 'rem' });
    });

    it('should parse negative em values', () => {
      expect(parseSize('-2em')).toEqual({ value: -2, unit: 'em' });
    });

    it('should parse percentage values', () => {
      expect(parseSize('50%')).toEqual({ value: 50, unit: '%' });
    });

    it('should return null for units it does not support', () => {
      expect(parseSize('10vw')).toBeNull();
    });

    it('should return null for non-matching strings', () => {
      expect(parseSize('auto')).toBeNull();
      expect(parseSize('')).toBeNull();
      expect(parseSize('10')).toBeNull();
    });
  });
});
