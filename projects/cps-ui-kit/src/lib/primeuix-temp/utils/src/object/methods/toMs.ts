/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/toMs.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function toMs(value: string | number): number {
    if (value === 'auto') return 0;

    if (typeof value === 'number') return value;

    return Number(value.replace(/[^\d.]/g, '').replace(',', '.')) * 1000;
}
