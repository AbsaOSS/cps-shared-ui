/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getBrowser.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import resolveUserAgent from './resolveUserAgent';

type BrowserType = {
    [key: string]: string | boolean | undefined;
};

let browser: BrowserType | null = null;

export default function getBrowser(): BrowserType {
    if (!browser) {
        browser = {};

        const matched = resolveUserAgent();

        if (matched.browser) {
            browser[matched.browser] = true;
            browser['version'] = matched.version;
        }

        if (browser['chrome']) {
            browser['webkit'] = true;
        } else if (browser['webkit']) {
            browser['safari'] = true;
        }
    }

    return browser;
}
