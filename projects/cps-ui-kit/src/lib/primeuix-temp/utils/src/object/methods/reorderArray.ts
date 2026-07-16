/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/reorderArray.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function reorderArray<T>(value: T[], from: number, to: number): void {
    if (value && from !== to) {
        if (to >= value.length) {
            to %= value.length;
            from %= value.length;
        }

        value.splice(to, 0, value.splice(from, 1)[0]);
    }
}
