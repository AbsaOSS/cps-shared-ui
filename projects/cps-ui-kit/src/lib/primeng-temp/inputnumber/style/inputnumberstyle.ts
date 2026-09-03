// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/inputnumber/style/inputnumberstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as inputnumber_style } from '../../../primeuix-temp/styles/src/inputnumber/index';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${inputnumber_style}

    /* For PrimeNG */
    p-inputNumber.ng-invalid.ng-dirty > .p-inputtext,
    p-input-number.ng-invalid.ng-dirty > .p-inputtext,
    p-inputnumber.ng-invalid.ng-dirty > .p-inputtext {
        border-color: dt('inputtext.invalid.border.color');
    }

    p-inputNumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus,
    p-input-number.ng-invalid.ng-dirty > .p-inputtext:enabled:focus,
    p-inputnumber.ng-invalid.ng-dirty > .p-inputtext:enabled:focus {
        border-color: dt('inputtext.focus.border.color');
    }

    p-inputNumber.ng-invalid.ng-dirty > .p-inputtext::placeholder,
    p-input-number.ng-invalid.ng-dirty > .p-inputtext::placeholder,
    p-inputnumber.ng-invalid.ng-dirty > .p-inputtext::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-inputnumber p-component p-inputwrapper',
        {
            'p-inputwrapper-filled': instance.$filled() || instance.allowEmpty === false,
            'p-inputwrapper-focus': instance.focused,
            'p-inputnumber-stacked': instance.showButtons && instance.buttonLayout === 'stacked',
            'p-inputnumber-horizontal': instance.showButtons && instance.buttonLayout === 'horizontal',
            'p-inputnumber-vertical': instance.showButtons && instance.buttonLayout === 'vertical',
            'p-inputnumber-fluid': instance.hasFluid,
            'p-invalid': instance.invalid()
        }
    ],
    pcInputText: 'p-inputnumber-input',
    buttonGroup: 'p-inputnumber-button-group',
    incrementButton: ({ instance }) => [
        'p-inputnumber-button p-inputnumber-increment-button',
        {
            'p-disabled': instance.showButtons && instance.max() != null && instance.maxlength()
        }
    ],
    decrementButton: ({ instance }) => [
        'p-inputnumber-button p-inputnumber-decrement-button',
        {
            'p-disabled': instance.showButtons && instance.min() != null && instance.minlength()
        }
    ],
    clearIcon: 'p-inputnumber-clear-icon'
};

@Injectable()
export class InputNumberStyle extends BaseStyle {
    name = 'inputnumber';

    style = style;

    classes = classes;
}

/**
 *
 * InputNumber is an input component to provide numerical input.
 *
 * [Live Demo](https://www.primeng.org/inputnumber/)
 *
 * @module inputnumberstyle
 *
 */

export enum InputNumberClasses {
    /**
     * Class name of the root element
     */
    root = 'p-inputnumber',
    /**
     * Class name of the input element
     */
    pcInputText = 'p-inputnumber-input',
    /**
     * Class name of the button group element
     */
    buttonGroup = 'p-inputnumber-button-group',
    /**
     * Class name of the increment button element
     */
    incrementButton = 'p-inputnumber-increment-button',
    /**
     * Class name of the decrement button element
     */
    decrementButton = 'p-inputnumber-decrement-button',
    /**
     * Class name of the clear icon
     */
    clearIcon = 'p-autocomplete-clear-icon'
}

export interface InputNumberStyle extends BaseStyle {}
