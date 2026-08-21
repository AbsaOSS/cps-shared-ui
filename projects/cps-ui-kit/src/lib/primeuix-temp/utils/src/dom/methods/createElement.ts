/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/createElement.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import setAttributes from './setAttributes';

export default function createElement(type: string, attributes: Record<string, unknown> = {}, ...children: (string | Node)[]): HTMLElement | undefined {
    if (type) {
        const element = document.createElement(type);

        setAttributes(element, attributes);
        element.append(...children);

        return element;
    }

    return undefined;
}
