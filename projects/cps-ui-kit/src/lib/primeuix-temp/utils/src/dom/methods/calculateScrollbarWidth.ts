/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/calculateScrollbarWidth.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import addStyle from './addStyle';

let calculatedScrollbarWidth: number | undefined = undefined;

export default function calculateScrollbarWidth(element?: HTMLElement): number {
    if (element) {
        const style = getComputedStyle(element);

        return element.offsetWidth - element.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
    } else {
        if (calculatedScrollbarWidth != null) return calculatedScrollbarWidth;

        const scrollDiv = document.createElement('div');

        addStyle(scrollDiv, {
            width: '100px',
            height: '100px',
            overflow: 'scroll',
            position: 'absolute',
            top: '-9999px'
        });
        document.body.appendChild(scrollDiv);

        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

        document.body.removeChild(scrollDiv);

        calculatedScrollbarWidth = scrollbarWidth;

        return scrollbarWidth;
    }
}
