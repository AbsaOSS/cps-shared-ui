/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/createStyleElement.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import createElement from './createElement';

export default function createStyleElement(css: string, attributes: Record<string, unknown> = {}, container?: Element): HTMLStyleElement {
    const element = createElement('style', attributes, css)! as HTMLStyleElement;

    container?.appendChild(element);

    return element;
}
