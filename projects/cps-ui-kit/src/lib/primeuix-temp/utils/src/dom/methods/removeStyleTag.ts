/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/removeStyleTag.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isExist from './isExist';

export default function removeStyleTag(element: Node): Node | null {
    if (isExist(element)) {
        try {
            element.parentNode?.removeChild(element);
        } catch {
            // style element may have already been removed in a fast refresh
        }

        return null;
    }

    return element;
}
