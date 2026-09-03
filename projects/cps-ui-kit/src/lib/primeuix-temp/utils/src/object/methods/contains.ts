/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/contains.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import equals from './equals';

export default function contains<T = unknown>(value: T, list: T[]): boolean {
    if (value != null && list && list.length) {
        for (const val of list) {
            if (equals(value, val)) return true;
        }
    }

    return false;
}
