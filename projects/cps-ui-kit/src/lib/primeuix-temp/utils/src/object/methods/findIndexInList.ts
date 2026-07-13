/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/findIndexInList.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function findIndexInList<T = any>(value: T, list: T[]): number {
    let index = -1;

    if (list) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === value) {
                index = i;
                break;
            }
        }
    }

    return index;
}
