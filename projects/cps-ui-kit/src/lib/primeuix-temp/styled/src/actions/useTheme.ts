/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/styled/src/actions/useTheme.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import { $t } from '../helpers/index';

export default function useTheme<T = unknown>(theme: T): T {
    return $t(theme).update({ mergePresets: false }) as T;
}
