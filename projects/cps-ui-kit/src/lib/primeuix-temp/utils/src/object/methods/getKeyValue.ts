/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/getKeyValue.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isObject from './isObject';
import resolve from './resolve';
import toFlatCase from './toFlatCase';

export default function getKeyValue<T extends Record<string, unknown>>(obj: T | undefined, key: string = '', params: unknown = {}): unknown {
    const fKeys = toFlatCase(key).split('.');
    const fKey = fKeys.shift();

    if (fKey) {
        if (isObject(obj)) {
            const matchedKey = Object.keys(obj).find((k) => toFlatCase(k) === fKey) || '';

            return getKeyValue(resolve(obj[matchedKey], params) as Record<string, unknown>, fKeys.join('.'), params);
        }

        return undefined;
    }

    return resolve(obj, params);
}
