/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/createStyleMarkup.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function createStyleMarkup(css?: string, attributes: Record<string, unknown> = {}): string {
    return css ? `<style${Object.entries(attributes).reduce((s, [k, v]) => s + ` ${k}="${v}"`, '')}>${css}</style>` : '';
}
