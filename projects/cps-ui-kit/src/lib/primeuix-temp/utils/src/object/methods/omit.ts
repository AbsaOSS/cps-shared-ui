/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/omit.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isObject from './isObject';

export default function omit(obj: unknown, ...keys: string[]): unknown {
    if (!isObject(obj)) return obj;

    const copy = { ...(obj as Record<string, unknown>) };

    keys?.flat().forEach((key) => delete copy[key]);

    return copy;
}
