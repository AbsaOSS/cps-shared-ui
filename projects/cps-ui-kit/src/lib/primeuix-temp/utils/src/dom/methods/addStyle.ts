/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/addStyle.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function addStyle(element: HTMLElement, style: string | object): void {
    if (element) {
        if (typeof style === 'string') {
            element.style.cssText = style;
        } else {
            Object.entries(style || {}).forEach(([key, value]: [string, string]) => ((element.style as any)[key] = value));
        }
    }
}
