/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/findLastIndex.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isNotEmpty from './isNotEmpty';

/**
 * Firefox-v103 does not currently support the "findLastIndex" method. It is stated that this method will be supported with Firefox-v104.
 * https://caniuse.com/mdn-javascript_builtins_array_findlastindex
 */
export default function findLastIndex<T = any>(arr: T[], callback: (value: T, index: number, array: T[]) => boolean): number {
    let index = -1;

    if (isNotEmpty(arr)) {
        try {
            index = (arr as any).findLastIndex(callback);
        } catch {
            index = arr.lastIndexOf([...arr].reverse().find(callback) as T);
        }
    }

    return index;
}
