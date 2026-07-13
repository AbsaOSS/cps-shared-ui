/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/calculateScrollbarHeight.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import addStyle from './addStyle';

let calculatedScrollbarHeight: number | undefined = undefined;

export default function calculateScrollbarHeight(element?: HTMLElement): number {
    if (element) {
        const style = getComputedStyle(element);

        return element.offsetHeight - element.clientHeight - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
    } else {
        if (calculatedScrollbarHeight != null) return calculatedScrollbarHeight;

        const scrollDiv = document.createElement('div');

        addStyle(scrollDiv, {
            width: '100px',
            height: '100px',
            overflow: 'scroll',
            position: 'absolute',
            top: '-9999px'
        });
        document.body.appendChild(scrollDiv);

        const scrollbarHeight = scrollDiv.offsetHeight - scrollDiv.clientHeight;

        document.body.removeChild(scrollDiv);

        calculatedScrollbarHeight = scrollbarHeight;

        return scrollbarHeight;
    }
}
