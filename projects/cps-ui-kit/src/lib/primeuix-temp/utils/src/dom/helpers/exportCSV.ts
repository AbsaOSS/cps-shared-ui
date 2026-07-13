/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/dom/helpers/exportCSV.ts
 * Modified: import paths rewritten to resolve locally. See ../../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import saveAs from './saveAs';

export default function exportCSV(csv: any, filename: string): void {
    const blob = new Blob([csv], {
        type: 'application/csv;charset=utf-8;'
    });

    if ((window.navigator as any).msSaveOrOpenBlob) {
        (navigator as any).msSaveOrOpenBlob(blob, filename + '.csv');
    } else {
        const isDownloaded = saveAs({ name: filename + '.csv', src: URL.createObjectURL(blob) });

        if (!isDownloaded) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
            window.open(encodeURI(csv));
        }
    }
}
