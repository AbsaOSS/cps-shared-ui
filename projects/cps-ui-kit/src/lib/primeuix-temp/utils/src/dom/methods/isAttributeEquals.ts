/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/isAttributeEquals.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getAttribute from './getAttribute';
import isElement from './isElement';

export default function isAttributeEquals(element: Element, name: string, value: any): boolean {
    return isElement(element) ? getAttribute(element, name) === value : false;
}
