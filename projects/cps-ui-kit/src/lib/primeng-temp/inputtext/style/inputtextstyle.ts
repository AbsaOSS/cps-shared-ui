// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/inputtext/style/inputtextstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as inputtext_style } from '../../../primeuix-temp/styles/src/inputtext/index';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${inputtext_style}

    /* For PrimeNG */
   .p-inputtext.ng-invalid.ng-dirty {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.ng-invalid.ng-dirty::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-inputtext p-component',
        {
            'p-filled': instance.$filled(),
            'p-inputtext-sm': instance.pSize === 'small',
            'p-inputtext-lg': instance.pSize === 'large',
            'p-invalid': instance.invalid(),
            'p-variant-filled': instance.$variant() === 'filled',
            'p-inputtext-fluid': instance.hasFluid
        }
    ]
};

@Injectable()
export class InputTextStyle extends BaseStyle {
    name = 'inputtext';

    style = style;

    classes = classes;
}

/**
 *
 * InputText renders a text field to enter data.
 *
 * [Live Demo](https://www.primeng.org/inputtext/)
 *
 * @module inputtextstyle
 *
 */
export enum InputTextClasses {
    /**
     * The class of root element
     */
    root = 'p-inputtext'
}

export interface InputTextStyle extends BaseStyle {}
