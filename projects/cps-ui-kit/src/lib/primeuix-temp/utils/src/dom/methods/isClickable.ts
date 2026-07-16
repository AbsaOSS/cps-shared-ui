/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/isClickable.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function isClickable(element: Element): boolean {
    if (element) {
        const targetNode = element.nodeName;
        const parentNode = element.parentElement && element.parentElement.nodeName;

        return (
            targetNode === 'INPUT' ||
            targetNode === 'TEXTAREA' ||
            targetNode === 'BUTTON' ||
            targetNode === 'A' ||
            parentNode === 'INPUT' ||
            parentNode === 'TEXTAREA' ||
            parentNode === 'BUTTON' ||
            parentNode === 'A' ||
            !!element.closest('.p-button, .p-checkbox, .p-radiobutton') // @todo Add [data-pc-section="button"]
        );
    }

    return false;
}
