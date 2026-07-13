/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/toTokenKey.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isString from './isString';

export default function toTokenKey(str: string): string {
    return isString(str) ? str.replace(/[A-Z]/g, (c, i) => (i === 0 ? c : '.' + c.toLowerCase())).toLowerCase() : str;
}
