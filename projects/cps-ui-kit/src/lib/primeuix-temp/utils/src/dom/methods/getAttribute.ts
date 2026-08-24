/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getAttribute.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isElement from './isElement';

export default function getAttribute(element: Element, name: string): any {
    if (isElement(element)) {
        const value = element.getAttribute(name);

        if (!isNaN(value as any)) {
            return +(value as string);
        }

        if (value === 'true' || value === 'false') {
            return value === 'true';
        }

        return value;
    }

    return undefined;
}
