/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getPreviousElementSibling.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getPreviousElementSibling(element: Element, selector: string): Element | null {
    let previousElement = element.previousElementSibling;

    while (previousElement) {
        if (previousElement.matches(selector)) {
            return previousElement;
        } else {
            previousElement = previousElement.previousElementSibling;
        }
    }

    return null;
}
