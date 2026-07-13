/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/isAttributeNotEquals.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isAttributeEquals from './isAttributeEquals';

export default function isAttributeNotEquals(element: Element, name: string, value: any): boolean {
    return !isAttributeEquals(element, name, value);
}
