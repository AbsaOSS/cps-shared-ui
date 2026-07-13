/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getNextElementSibling.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getNextElementSibling(element: Element, selector: string): Element | null {
    let nextElement = element.nextElementSibling;

    while (nextElement) {
        if (nextElement.matches(selector)) {
            return nextElement;
        } else {
            nextElement = nextElement.nextElementSibling;
        }
    }

    return null;
}
