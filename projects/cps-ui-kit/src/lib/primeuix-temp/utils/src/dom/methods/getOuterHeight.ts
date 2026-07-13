/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getOuterHeight.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getOuterHeight(element: HTMLElement, margin?: boolean): number {
    if (element) {
        let height = element.offsetHeight;

        if (margin) {
            const style = getComputedStyle(element);

            height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }

        return height;
    }

    return 0;
}
