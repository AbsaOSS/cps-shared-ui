/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/helpers/unblockBodyScroll.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import removeClass from '../methods/removeClass';

export interface UnblockBodyScrollOptions {
    className?: string;
    variableName?: string;
}

export default function unblockBodyScroll(option: string | UnblockBodyScrollOptions | undefined): void {
    if (typeof option === 'string') {
        removeClass(document.body, option || 'p-overflow-hidden');
    } else {
        if (option?.variableName) document.body.style.removeProperty(option.variableName);
        removeClass(document.body, option?.className || 'p-overflow-hidden');
    }
}
