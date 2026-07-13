// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/usestyle/usestyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { setAttribute, setAttributes } from '../../primeuix-temp/utils/src/index';

let _id = 0;

@Injectable({ providedIn: 'root' })
export class UseStyle {
    document: Document = inject(DOCUMENT);

    use(css, options: any = {}) {
        let isLoaded = false;
        let cssRef = css;
        let styleRef: HTMLStyleElement | null = null;

        const { immediate = true, manual = false, name = `style_${++_id}`, id = undefined, media = undefined, nonce = undefined, first = false, props = {} } = options;

        if (!this.document) return;
        styleRef = (this.document.querySelector(`style[data-primeng-style-id="${name}"]`) || (id && this.document.getElementById(id)) || this.document.createElement('style')) as HTMLStyleElement;

        if (styleRef) {
            if (!styleRef.isConnected) {
                cssRef = css;

                const HEAD = this.document.head;

                setAttribute(styleRef, 'nonce', nonce);

                first && HEAD.firstChild ? HEAD.insertBefore(styleRef, HEAD.firstChild) : HEAD.appendChild(styleRef);
                setAttributes(styleRef, {
                    type: 'text/css',
                    media,
                    nonce,
                    'data-primeng-style-id': name
                });
            }

            if (styleRef.textContent !== cssRef) {
                styleRef.textContent = cssRef;
            }
        }

        return {
            id,
            name,
            el: styleRef,
            css: cssRef
        };
    }
}
