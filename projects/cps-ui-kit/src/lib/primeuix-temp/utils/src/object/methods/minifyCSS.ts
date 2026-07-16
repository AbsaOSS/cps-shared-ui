/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/object/methods/minifyCSS.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function minifyCSS(css?: string): string | undefined {
    return css
        ? css
              .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
              .replace(/ {2,}/g, ' ')
              .replace(/ ([{:}]) /g, '$1')
              .replace(/([;,]) /g, '$1')
              .replace(/ !/g, '!')
              .replace(/: /g, ':')
              .trim()
        : css;
}
