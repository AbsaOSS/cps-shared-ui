/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/createStyleAsString.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import createStyleMarkup from './createStyleMarkup';

/**
 * @deprecated Use `createStyleMarkup` instead.
 */
export default function createStyleAsString(css?: string, options: Record<string, unknown> = {}) {
    return createStyleMarkup(css, options);
}
