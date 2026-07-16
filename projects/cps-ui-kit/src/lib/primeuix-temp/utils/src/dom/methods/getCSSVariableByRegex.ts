/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/methods/getCSSVariableByRegex.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function getCSSVariableByRegex(variableRegex: RegExp): { name: string | undefined; value: string | undefined } | null {
    for (const sheet of document?.styleSheets) {
        try {
            for (const rule of sheet?.cssRules) {
                for (const property of (rule as CSSStyleRule)?.style) {
                    if (variableRegex.test(property)) {
                        return { name: property, value: (rule as CSSStyleRule).style.getPropertyValue(property).trim() };
                    }
                }
            }
        } catch {}
    }

    return null;
}
