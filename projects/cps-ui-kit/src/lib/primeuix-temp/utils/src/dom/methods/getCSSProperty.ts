/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getCSSProperty.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getCSSProperty(element?: HTMLElement, property?: string, inline?: boolean): string | null {
    if (element && property) {
        return inline ? element?.style?.getPropertyValue(property) : getComputedStyle(element).getPropertyValue(property);
    }

    return null;
}
