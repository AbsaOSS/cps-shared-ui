// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/radiobutton/style/radiobuttonstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as radiobutton_style } from '../../../primeuix-temp/styles/src/radiobutton/index';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${radiobutton_style}

    /* For PrimeNG */
    p-radioButton.ng-invalid.ng-dirty .p-radiobutton-box,
    p-radio-button.ng-invalid.ng-dirty .p-radiobutton-box,
    p-radiobutton.ng-invalid.ng-dirty .p-radiobutton-box {
        border-color: dt('radiobutton.invalid.border.color');
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-radiobutton p-component',
        {
            'p-radiobutton-checked': instance.checked,
            'p-disabled': instance.$disabled(),
            'p-invalid': instance.invalid(),
            'p-variant-filled': instance.$variant() === 'filled',
            'p-radiobutton-sm p-inputfield-sm': instance.size() === 'small',
            'p-radiobutton-lg p-inputfield-lg': instance.size() === 'large'
        }
    ],
    box: 'p-radiobutton-box',
    input: 'p-radiobutton-input',
    icon: 'p-radiobutton-icon'
};

@Injectable()
export class RadioButtonStyle extends BaseStyle {
    name = 'radiobutton';

    style = style;

    classes = classes;
}

/**
 *
 * RadioButton is an extension to standard radio button element with theming.
 *
 * [Live Demo](https://www.primeng.org/radiobutton/)
 *
 * @module radiobuttonstyle
 *
 */
export enum RadioButtonClasses {
    /**
     * Class name of the root element
     */
    root = 'p-radiobutton',
    /**
     * Class name of the box element
     */
    box = 'p-radiobutton-box',
    /**
     * Class name of the input element
     */
    input = 'p-radiobutton-input',
    /**
     * Class name of the icon element
     */
    icon = 'p-radiobutton-icon'
}

export interface RadioButtonStyle extends BaseStyle {}
