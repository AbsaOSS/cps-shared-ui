/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getOuterWidth.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getOuterWidth(element: unknown, margin?: boolean): number {
    if (element instanceof HTMLElement) {
        let width = element.offsetWidth;

        if (margin) {
            const style = getComputedStyle(element);

            width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        }

        return width;
    }

    return 0;
}
