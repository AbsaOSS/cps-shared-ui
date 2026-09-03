/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getWindowScrollLeft.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getScrollLeft from './getScrollLeft';

export default function getWindowScrollLeft(): number {
    const doc = document.documentElement;

    return (window.pageXOffset || getScrollLeft(doc)) - (doc.clientLeft || 0);
}
