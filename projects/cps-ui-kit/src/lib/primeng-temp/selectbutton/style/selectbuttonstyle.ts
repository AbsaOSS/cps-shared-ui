// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/selectbutton/style/selectbuttonstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as selectbutton_style } from '@primeuix/styles/selectbutton';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${selectbutton_style}

    /* For PrimeNG */
    .p-selectbutton.ng-invalid.ng-dirty {
        outline: 1px solid dt('selectbutton.invalid.border.color');
        outline-offset: 0;
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-selectbutton p-component',
        {
            'p-invalid': instance.invalid(),
            'p-selectbutton-fluid': instance.fluid()
        }
    ]
};

@Injectable()
export class SelectButtonStyle extends BaseStyle {
    name = 'selectbutton';

    style = style;

    classes = classes;
}

/**
 *
 * SelectButton is used to choose single or multiple items from a list using buttons.
 *
 * [Live Demo](https://www.primeng.org/selectbutton/)
 *
 * @module selectbuttonstyle
 *
 */
export enum SelectButtonClasses {
    /**
     * Class name of the root element
     */
    root = 'p-selectbutton'
}

export interface SelectButtonStyle extends BaseStyle {}
