/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/isExist.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getParentNode from './getParentNode';

export default function isExist(element: Node): boolean {
    return !!(element !== null && typeof element !== 'undefined' && element.nodeName && getParentNode(element));
}
