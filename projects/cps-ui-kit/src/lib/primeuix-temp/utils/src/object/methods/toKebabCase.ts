/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/toKebabCase.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isString from './isString';

export default function toKebabCase(str: string): string {
    // convert snake, camel and pascal cases to kebab case
    return isString(str)
        ? str
              .replace(/(_)/g, '-')
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase()
        : str;
}
