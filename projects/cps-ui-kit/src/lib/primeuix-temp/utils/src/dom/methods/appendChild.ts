/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/appendChild.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import getTargetElement from './getTargetElement';

export default function appendChild(element: unknown, child: Node | Element) {
    const target: Document | Element | null | undefined = getTargetElement(element, child as Element) as Exclude<ReturnType<typeof getTargetElement>, Window>;

    if (target) target.appendChild(child);
    else throw new Error('Cannot append ' + child + ' to ' + element);
}
