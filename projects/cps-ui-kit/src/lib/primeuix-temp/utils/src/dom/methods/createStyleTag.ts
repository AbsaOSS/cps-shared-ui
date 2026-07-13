/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/createStyleTag.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import createStyleElement from './createStyleElement';

/**
 * @deprecated Use `createStyleElement` instead.
 */
export default function createStyleTag(attributes: Record<string, unknown> = {}, container?: Element): HTMLStyleElement {
    return createStyleElement('', attributes, container || document.head);
}
