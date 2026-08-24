/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/isElement.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function isElement(element: unknown): element is Element {
    return typeof Element !== 'undefined' ? element instanceof Element : element !== null && typeof element === 'object' && (element as Element).nodeType === 1 && typeof (element as Element).nodeName === 'string';
}
