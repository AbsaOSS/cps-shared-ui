/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/scrollInView.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getOuterHeight from './getOuterHeight';

export default function scrollInView(container: HTMLElement, item: HTMLElement): void {
    const borderTopValue = getComputedStyle(container).getPropertyValue('borderTopWidth');
    const borderTop = borderTopValue ? parseFloat(borderTopValue) : 0;
    const paddingTopValue = getComputedStyle(container).getPropertyValue('paddingTop');
    const paddingTop = paddingTopValue ? parseFloat(paddingTopValue) : 0;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const offset = itemRect.top + document.body.scrollTop - (containerRect.top + document.body.scrollTop) - borderTop - paddingTop;
    const scroll = container.scrollTop;
    const elementHeight = container.clientHeight;
    const itemHeight = getOuterHeight(item);

    if (offset < 0) {
        container.scrollTop = scroll + offset;
    } else if (offset + itemHeight > elementHeight) {
        container.scrollTop = scroll + offset - elementHeight + itemHeight;
    }
}
