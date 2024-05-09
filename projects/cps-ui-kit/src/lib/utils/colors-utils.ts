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

const isDark = (color: string): boolean => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (color.match(/^rgb/)) {
    const colorMatched = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    ) as any;
    r = colorMatched[1];
    g = colorMatched[2];
    b = colorMatched[3];
  } else {
    const colorNum = +(
      '0x' + color.slice(1).replace(color.length < 5 && (/./g as any), '$&$&')
    );

    r = colorNum >> 16;
    g = (colorNum >> 8) & 255;
    b = colorNum & 255;
  }

  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  return hsp <= 127.5;
};

export const getCpsColors = (_document: Document): [string, string][] =>
  [...(_document.styleSheets as any)]
    .filter((sheet: any) =>
      isSameDomain(sheet, _document.defaultView as Window)
    )
    .reduce(
      (finalArr, sheet) =>
        finalArr.concat(
          [...sheet.cssRules].filter(isStyleRule).reduce((propValArr, rule) => {
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
  if (isDark(backgroundColor)) {
    return '#FFFFFF';
  } else {
    return '#000000';
  }
};
