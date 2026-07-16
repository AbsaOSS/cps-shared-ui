/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getFirstFocusableElement.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getFocusableElements from './getFocusableElements';

export default function getFirstFocusableElement(element: Element, selector?: string): Element | null {
    const focusableElements = getFocusableElements(element, selector);

    return focusableElements.length > 0 ? focusableElements[0] : null;
}
