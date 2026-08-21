/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getHiddenElementDimensions.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getHiddenElementDimensions(element?: HTMLElement): { width: number; height: number } {
    const dimensions: { width: number; height: number } = { width: 0, height: 0 };

    if (element) {
        const [visibility, display] = [element.style.visibility, element.style.display];
        const rect = element.getBoundingClientRect();

        // Temporarily hide the element to get its dimensions
        element.style.visibility = 'hidden';
        element.style.display = 'block';
        dimensions.width = rect.width || element.offsetWidth;
        dimensions.height = rect.height || element.offsetHeight;
        element.style.display = display;
        element.style.visibility = visibility;
    }

    return dimensions;
}
