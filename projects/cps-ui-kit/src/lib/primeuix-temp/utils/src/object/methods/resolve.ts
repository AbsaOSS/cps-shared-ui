/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/resolve.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import isFunction from './isFunction';

export default function resolve<T, P extends unknown[], R>(obj: T | ((...params: P) => R), ...params: P): T | R {
    return isFunction(obj) ? (obj as (...params: P) => R)(...params) : (obj as T);
}
