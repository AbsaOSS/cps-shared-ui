/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/insertIntoOrderedArray.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import findIndexInList from './findIndexInList';

export default function insertIntoOrderedArray<T>(item: T, index: number, arr: T[], sourceArr: any[]): void {
    if (arr.length > 0) {
        let injected = false;

        for (let i = 0; i < arr.length; i++) {
            const currentItemIndex = findIndexInList(arr[i], sourceArr);

            if (currentItemIndex > index) {
                arr.splice(i, 0, item);
                injected = true;
                break;
            }
        }

        if (!injected) {
            arr.push(item);
        }
    } else {
        arr.push(item);
    }
}
