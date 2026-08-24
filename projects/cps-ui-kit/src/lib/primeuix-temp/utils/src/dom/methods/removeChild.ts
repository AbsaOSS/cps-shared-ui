/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/removeChild.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import toElement from './toElement';

export default function removeChild(element: unknown, child: Node) {
    const target = toElement(element);

    if (target) target.removeChild(child);
    else throw new Error('Cannot remove ' + child + ' from ' + element);
}
