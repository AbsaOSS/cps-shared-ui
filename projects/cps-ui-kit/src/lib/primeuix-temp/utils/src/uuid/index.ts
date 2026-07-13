/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/uuid/index.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
const lastIds: { [key: string]: number } = {};

export function uuid(prefix: string = 'pui_id_'): string {
    if (!Object.hasOwn(lastIds, prefix)) {
        lastIds[prefix] = 0;
    }

    lastIds[prefix]++;

    return `${prefix}${lastIds[prefix]}`;
}
