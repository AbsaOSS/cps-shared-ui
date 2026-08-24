/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getIndex.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getParentNode from './getParentNode';

export default function getIndex(element: HTMLElement): number {
    if (element) {
        const children = getParentNode(element)?.childNodes;
        let num = 0;

        if (children) {
            for (let i = 0; i < children.length; i++) {
                if (children[i] === element) return num;
                if (children[i].nodeType === 1) num++;
            }
        }
    }

    return -1;
}
