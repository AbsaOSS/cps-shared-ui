/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/filter.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import resolveFieldData from './resolveFieldData';

export default function filter<T = any>(value: T[], fields: string[], filterValue: string): T[] {
    const filteredItems = [];

    if (value) {
        for (const item of value) {
            for (const field of fields) {
                if (String(resolveFieldData(item, field)).toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
                    filteredItems.push(item);
                    break;
                }
            }
        }
    }

    return filteredItems;
}
