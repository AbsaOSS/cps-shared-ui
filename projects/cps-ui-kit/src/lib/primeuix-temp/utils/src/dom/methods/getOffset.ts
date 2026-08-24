/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getOffset.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getScrollLeft from './getScrollLeft';

export default function getOffset(element?: Element | null): { top: number | string; left: number | string } {
    if (element) {
        const rect = element.getBoundingClientRect();

        return {
            top: rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
            left: rect.left + (window.pageXOffset || getScrollLeft(document.documentElement) || getScrollLeft(document.body) || 0)
        };
    }

    return {
        top: 'auto',
        left: 'auto'
    };
}
