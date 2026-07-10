const isSameDomain = (styleSheet: any, _window: Window): boolean => {
  if (!styleSheet.href) {
    return true;
  }

  return styleSheet.href.indexOf(_window.location.origin) === 0;
};

const isStyleRule = (rule: any): boolean => rule.type === 1;

const isValidCSSColor = (val: string, _document: Document): boolean => {
  if (val === 'currentColor') return true;
  const element = _document.createElement('div');
  element.style.backgroundColor = val;
  return element && element.style.backgroundColor !== '';
};

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const getRelativeLuminance = (color: string): number => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (color.match(/^rgb/)) {
    const m = color.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return 0;
    r = +m[1];
    g = +m[2];
    b = +m[3];
  } else {
    const num = +(
      '0x' + color.slice(1).replace(color.length < 5 && (/./g as any), '$&$&')
    );
    r = num >> 16;
    g = (num >> 8) & 255;
    b = num & 255;
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Collects all --cps-color-* CSS custom properties from :root rules only.
 * Theme overrides (e.g. [data-theme='dark']) are excluded to avoid duplicates,
 * since the Colors page serves as a base palette reference.
 */
export const getCpsColors = (_document: Document): [string, string][] =>
  [...(_document.styleSheets as any)]
    .filter((sheet: any) =>
      isSameDomain(sheet, _document.defaultView as Window)
    )
    .reduce(
      (finalArr, sheet) =>
        finalArr.concat(
          [...sheet.cssRules]
            .filter(
              (rule: any) => isStyleRule(rule) && rule.selectorText === ':root'
            )
            .reduce((propValArr, rule) => {
              const props = [...rule.style]
                .map((propName) => [
                  propName.trim(),
                  rule.style.getPropertyValue(propName).trim()
                ])
                .filter(([propName]) => propName.indexOf('--cps-color') === 0);

              return [...propValArr, ...props];
            }, [])
        ),
      []
    );

export const getCSSColor = (val: string, _document: Document): string => {
  if (!val) return '';
  return isValidCSSColor(val, _document) ? val : `var(--cps-color-${val})`;
};

export const getTextColor = (backgroundColor: string): string => {
  const L = getRelativeLuminance(backgroundColor);
  const contrastOnWhite = 1.05 / (L + 0.05);
  const contrastOnBlack = (L + 0.05) / 0.05;
  return contrastOnWhite >= contrastOnBlack ? '#FFFFFF' : '#000000';
};
