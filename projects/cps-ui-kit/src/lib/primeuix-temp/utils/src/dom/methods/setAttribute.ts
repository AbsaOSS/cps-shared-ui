/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/setAttribute.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isElement from './isElement';

export default function setAttribute(element: HTMLElement, attribute: string = '', value: any): void {
    if (isElement(element) && value !== null && value !== undefined) {
        element.setAttribute(attribute, value);
    }
}
