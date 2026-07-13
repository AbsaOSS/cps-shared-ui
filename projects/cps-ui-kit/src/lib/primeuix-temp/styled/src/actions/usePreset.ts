/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/styled/src/actions/usePreset.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import { deepMerge } from '../../../utils/src/object/index';
import Theme from '../config/index';

export default function usePreset<T extends Record<string, unknown>>(...presets: T[]): T {
    const newPreset = deepMerge(...presets);

    Theme.setPreset(newPreset);

    return newPreset as T;
}
