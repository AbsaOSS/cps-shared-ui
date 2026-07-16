/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/hasClass.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function hasClass(element: Element, className: string): boolean {
    if (element) {
        if (element.classList) return element.classList.contains(className);
        else return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }

    return false;
}
