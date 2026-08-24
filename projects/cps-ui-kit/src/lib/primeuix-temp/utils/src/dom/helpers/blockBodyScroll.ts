/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/helpers/blockBodyScroll.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import addClass from '../methods/addClass';
import calculateBodyScrollbarWidth from '../methods/calculateBodyScrollbarWidth';

export interface BlockBodyScrollOptions {
    className?: string;
    variableName?: string;
}

export default function blockBodyScroll(option: string | BlockBodyScrollOptions | undefined): void {
    if (typeof option === 'string') {
        addClass(document.body, option || 'p-overflow-hidden');
    } else {
        option?.variableName && document.body.style.setProperty(option.variableName, calculateBodyScrollbarWidth() + 'px');
        addClass(document.body, option?.className || 'p-overflow-hidden');
    }
}
