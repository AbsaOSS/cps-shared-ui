/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/nestedPosition.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import calculateScrollbarWidth from './calculateScrollbarWidth';
import getHiddenElementOuterHeight from './getHiddenElementOuterHeight';
import getHiddenElementOuterWidth from './getHiddenElementOuterWidth';
import getOffset from './getOffset';
import getOuterHeight from './getOuterHeight';
import getOuterWidth from './getOuterWidth';
import getViewport from './getViewport';

export default function nestedPosition(element: HTMLElement, level: number): void {
    if (element) {
        const parentItem = element.parentElement;
        const elementOffset = getOffset(parentItem);
        const viewport = getViewport();
        const sublistWidth = element.offsetParent ? element.offsetWidth : getHiddenElementOuterWidth(element);
        const sublistHeight = element.offsetParent ? element.offsetHeight : getHiddenElementOuterHeight(element);
        const itemOuterWidth = getOuterWidth(parentItem?.children?.[0]);
        const itemOuterHeight = getOuterHeight(parentItem?.children?.[0] as HTMLElement);

        let left: string = '';
        let top: string = '';

        if ((elementOffset.left as number) + itemOuterWidth + sublistWidth > viewport.width - calculateScrollbarWidth()) {
            if ((elementOffset.left as number) < sublistWidth) {
                // for too small screens
                if (level % 2 === 1) {
                    left = (elementOffset.left as number) ? '-' + (elementOffset.left as number) + 'px' : '100%';
                } else if (level % 2 === 0) {
                    left = viewport.width - sublistWidth - calculateScrollbarWidth() + 'px';
                }
            } else {
                left = '-100%';
            }
        } else {
            left = '100%';
        }

        // getBoundingClientRect returns a top position from the current visible viewport area
        if (element.getBoundingClientRect().top + itemOuterHeight + sublistHeight > viewport.height) {
            top = `-${sublistHeight - itemOuterHeight}px`;
        } else {
            top = '0px';
        }

        element.style.top = top;
        element.style.insetInlineStart = left;
    }
}
