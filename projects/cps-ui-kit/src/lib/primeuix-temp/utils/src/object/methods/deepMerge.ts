/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/deepMerge.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isObject from './isObject';

function _deepMerge(target: Record<string, unknown> = {}, source: Record<string, unknown> = {}): Record<string, unknown> {
    const mergedObj: Record<string, unknown> = { ...target };

    Object.keys(source).forEach((key) => {
        const typedKey = key as keyof typeof source;

        if (isObject(source[typedKey]) && typedKey in target && isObject(target[typedKey])) {
            mergedObj[typedKey] = _deepMerge(target[typedKey] as Record<string, unknown>, source[typedKey] as Record<string, unknown>);
        } else {
            mergedObj[typedKey] = source[typedKey];
        }
    });

    return mergedObj;
}

/**
 * Merges multiple objects into one.
 * @param args - Objects to merge.
 * @returns Merged object.
 */
export default function deepMerge(...args: Record<string, unknown>[]): Record<string, unknown> {
    return args.reduce((acc, obj, i) => (i === 0 ? obj : _deepMerge(acc, obj)), {});
}
