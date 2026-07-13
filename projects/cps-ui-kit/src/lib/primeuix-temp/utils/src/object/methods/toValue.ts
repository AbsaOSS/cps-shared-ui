/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/toValue.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import resolve from './resolve';

type ReactRef = { current: unknown };
type VueRef = { value: unknown };

export default function toValue(value: unknown): unknown {
    if (value && typeof value === 'object') {
        if (Object.hasOwn(value, 'current')) {
            // For React
            return (value as ReactRef).current;
        } else if (Object.hasOwn(value, 'value')) {
            // For Vue
            return (value as VueRef).value;
        }
    }

    // For Angular signals and functions usage
    return resolve(value);
}
