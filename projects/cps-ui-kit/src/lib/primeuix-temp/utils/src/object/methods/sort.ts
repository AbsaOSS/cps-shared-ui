/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/sort.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import compare from './compare';
import isEmpty from './isEmpty';

export default function sort<T>(value1: T, value2: T, order: number = 1, comparator: (val1: T, val2: T) => number, nullSortOrder: number = 1): number {
    const result = compare(value1, value2, comparator, order);
    let finalSortOrder = order;

    // nullSortOrder == 1 means Excel like sort nulls at bottom
    if (isEmpty(value1) || isEmpty(value2)) {
        finalSortOrder = nullSortOrder === 1 ? order : nullSortOrder;
    }

    return finalSortOrder * result;
}
