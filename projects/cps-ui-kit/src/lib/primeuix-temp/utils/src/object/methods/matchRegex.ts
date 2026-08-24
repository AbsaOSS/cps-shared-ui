/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/matchRegex.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function matchRegex(str: string, regex?: RegExp): boolean {
    if (regex) {
        const match = regex.test(str);

        regex.lastIndex = 0;

        return match;
    }

    return false;
}
