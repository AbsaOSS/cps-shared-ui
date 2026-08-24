/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/equals.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import deepEquals from './deepEquals';
import resolveFieldData from './resolveFieldData';

export default function equals(obj1: any, obj2: any, field?: string): boolean {
    if (field) return resolveFieldData(obj1, field) === resolveFieldData(obj2, field);
    else return deepEquals(obj1, obj2);
}
