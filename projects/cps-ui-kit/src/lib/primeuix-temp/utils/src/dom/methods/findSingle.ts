/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/findSingle.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isElement from './isElement';

export default function findSingle(element: Element, selector: string): Element | null {
    return isElement(element) ? (element.matches(selector) ? element : element.querySelector(selector)) : null;
}
