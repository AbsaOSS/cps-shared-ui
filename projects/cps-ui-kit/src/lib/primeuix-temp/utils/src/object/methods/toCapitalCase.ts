/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/toCapitalCase.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isString from './isString';

export default function toCapitalCase(str: string): string {
    return isString(str, false) ? str[0].toUpperCase() + str.slice(1) : str;
}
