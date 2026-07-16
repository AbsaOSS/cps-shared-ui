/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/resolveFieldData.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isFunction from './isFunction';
import isNotEmpty from './isNotEmpty';

export default function resolveFieldData(data: any, field: any): any {
    if (!data || !field) {
        // short circuit if there is nothing to resolve
        return null;
    }

    try {
        const value = data[field];

        if (isNotEmpty(value)) return value;
    } catch {
        // Performance optimization: https://github.com/primefaces/primereact/issues/4797
        // do nothing and continue to other methods to resolve field data
    }

    if (Object.keys(data).length) {
        if (isFunction(field)) {
            return field(data);
        } else if (field.indexOf('.') === -1) {
            return data[field];
        } else {
            const fields = field.split('.');
            let value = data;

            for (let i = 0, len = fields.length; i < len; ++i) {
                if (value == null) {
                    return null;
                }

                value = value[fields[i]];
            }

            return value;
        }
    }

    return null;
}
