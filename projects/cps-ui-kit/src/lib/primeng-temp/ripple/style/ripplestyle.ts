// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/ripple/style/ripplestyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as ripple_style } from '../../../primeuix-temp/styles/src/ripple/index';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${ripple_style}

    /* For PrimeNG */
    .p-ripple {
        overflow: hidden;
        position: relative;
    }

    .p-ripple-disabled .p-ink {
        display: none !important;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`;

const classes = {
    root: 'p-ink'
};

@Injectable()
export class RippleStyle extends BaseStyle {
    name = 'ripple';

    style = style;

    classes = classes;
}

/**
 *
 * Ripple directive adds ripple effect to the host element.
 *
 * [Live Demo](https://www.primeng.org/ripple)
 *
 * @module ripplestyle
 *
 */

export enum RippleClasses {
    /**
     * Class name of the root element
     */
    root = 'p-ink'
}

export interface RippleStyle extends BaseStyle {}
