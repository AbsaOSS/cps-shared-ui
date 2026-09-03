/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getParentNode.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getParentNode(element: Node): ParentNode | null {
    if (element) {
        let parent = element.parentNode;

        if (parent && parent instanceof ShadowRoot && parent.host) {
            parent = parent.host;
        }

        return parent;
    }

    return null;
}
