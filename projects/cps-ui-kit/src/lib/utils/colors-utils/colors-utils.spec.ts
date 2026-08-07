import { getCpsColors, getCSSColor, getTextColor } from './colors-utils';

type FakeStyleDeclaration = {
  getPropertyValue: (name: string) => string;
  [Symbol.iterator](): Iterator<string>;
};

const makeStyleDeclaration = (
  props: Record<string, string>
): FakeStyleDeclaration => {
  const propNames = Object.keys(props);
  return {
    getPropertyValue: (name: string) => props[name] ?? '',
    [Symbol.iterator]: function* () {
      yield* propNames;
    }
  };
};

const makeRule = (
  selectorText: string,
  props: Record<string, string>,
  type = 1
) => ({
  type,
  selectorText,
  style: makeStyleDeclaration(props)
});

const makeSheet = (cssRules: unknown[], href: string | null = null) => ({
  href,
  cssRules
});

const makeFakeDocument = (
  styleSheets: unknown[],
  origin = 'https://example.com'
): Document =>
  ({
    styleSheets,
    defaultView: { location: { origin } }
  }) as unknown as Document;

describe('colors-utils', () => {
  describe('getTextColor', () => {
    it('should return black for a light background (hex)', () => {
      expect(getTextColor('#FFFFFF')).toBe('#000000');
      expect(getTextColor('#F0F0F0')).toBe('#000000');
    });

    it('should return white for a dark background (hex)', () => {
      expect(getTextColor('#000000')).toBe('#FFFFFF');
      expect(getTextColor('#111111')).toBe('#FFFFFF');
    });

    it('should accept rgb()/rgba() string form', () => {
      expect(getTextColor('rgb(0, 0, 0)')).toBe('#FFFFFF');
      expect(getTextColor('rgba(255, 255, 255, 1)')).toBe('#000000');
    });

    it('should accept 3-digit hex shorthand', () => {
      expect(getTextColor('#fff')).toBe('#000000');
      expect(getTextColor('#000')).toBe('#FFFFFF');
    });

    it('should resolve a mid-gray background to one deterministic value', () => {
      expect(getTextColor('#767676')).toBe('#000000');
    });
  });

  describe('getCSSColor', () => {
    it('should return an empty string for a falsy value', () => {
      expect(getCSSColor('', document)).toBe('');
    });

    it('should return currentColor unchanged', () => {
      expect(getCSSColor('currentColor', document)).toBe('currentColor');
    });

    it('should return a valid CSS color keyword unchanged', () => {
      expect(getCSSColor('red', document)).toBe('red');
    });

    it('should wrap an unknown value as a CSS variable reference', () => {
      expect(getCSSColor('not-a-color', document)).toBe(
        'var(--cps-color-not-a-color)'
      );
    });

    it('should wrap a bare palette key as a CSS variable reference', () => {
      expect(getCSSColor('primary', document)).toBe('var(--cps-color-primary)');
    });
  });

  describe('getCpsColors', () => {
    it('should return an empty array when there are no stylesheets', () => {
      expect(getCpsColors(makeFakeDocument([]))).toEqual([]);
    });

    it('should return an empty array when no stylesheet has a :root rule', () => {
      const sheet = makeSheet([
        makeRule('.foo', { '--cps-color-primary': '#123456' })
      ]);
      expect(getCpsColors(makeFakeDocument([sheet]))).toEqual([]);
    });

    it('should collect only --cps-color-* custom properties from :root rules', () => {
      const sheet = makeSheet([
        makeRule(':root', {
          '--cps-color-primary': '#123456',
          '--cps-color-secondary': '#abcdef',
          '--other-var': '1px'
        })
      ]);

      expect(getCpsColors(makeFakeDocument([sheet]))).toEqual([
        ['--cps-color-primary', '#123456'],
        ['--cps-color-secondary', '#abcdef']
      ]);
    });

    it('should ignore rules for non-:root selectors', () => {
      const sheet = makeSheet([
        makeRule(':root', { '--cps-color-primary': '#123456' }),
        makeRule("[data-theme='dark']", { '--cps-color-primary': '#000000' })
      ]);

      expect(getCpsColors(makeFakeDocument([sheet]))).toEqual([
        ['--cps-color-primary', '#123456']
      ]);
    });

    it('should ignore non-style rules', () => {
      const sheet = makeSheet([
        makeRule(':root', { '--cps-color-primary': '#123456' }, 3)
      ]);

      expect(getCpsColors(makeFakeDocument([sheet]))).toEqual([]);
    });

    it('should include same-domain stylesheets with no href (inline styles)', () => {
      const sheet = makeSheet(
        [makeRule(':root', { '--cps-color-primary': '#123456' })],
        null
      );

      expect(getCpsColors(makeFakeDocument([sheet]))).toEqual([
        ['--cps-color-primary', '#123456']
      ]);
    });

    it('should skip stylesheets from a different origin', () => {
      const sameOriginSheet = makeSheet(
        [makeRule(':root', { '--cps-color-primary': '#123456' })],
        'https://example.com/styles.css'
      );
      const crossOriginSheet = makeSheet(
        [makeRule(':root', { '--cps-color-secondary': '#abcdef' })],
        'https://cross-origin.example/x.css'
      );

      expect(
        getCpsColors(makeFakeDocument([sameOriginSheet, crossOriginSheet]))
      ).toEqual([['--cps-color-primary', '#123456']]);
    });
  });
});
