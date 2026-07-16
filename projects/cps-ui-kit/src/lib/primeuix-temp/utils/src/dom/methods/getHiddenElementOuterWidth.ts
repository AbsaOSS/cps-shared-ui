/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getHiddenElementOuterWidth.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getHiddenElementOuterWidth(element: HTMLElement): number {
    if (element) {
        const [visibility, display] = [element.style.visibility, element.style.display];

        // Temporarily hide the element to get its outer width
        element.style.visibility = 'hidden';
        element.style.display = 'block';
        const elementWidth = element.offsetWidth;

        element.style.display = display;
        element.style.visibility = visibility;

        return elementWidth;
    }

    return 0;
}
