/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/mergeKeys.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import deepMerge from './deepMerge';

/**
 * @deprecated Use `deepMerge` instead.
 *
 * Merges multiple objects into one.
 * @param args - Objects to merge.
 * @returns Merged object.
 */
export default function mergeKeys(...args: Record<string, unknown>[]): Record<string, unknown> {
    return deepMerge(...args);
}
