/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/helpers/saveAs.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export default function saveAs(file: { name: string; src: string }): boolean {
    if (file) {
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const { name, src } = file;

            link.setAttribute('href', src);
            link.setAttribute('download', name);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        }
    }

    return false;
}
