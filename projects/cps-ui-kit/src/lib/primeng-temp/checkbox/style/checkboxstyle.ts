// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/checkbox/style/checkboxstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as checkbox_style } from '@primeuix/styles/checkbox';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${checkbox_style}

    /* For PrimeNG */
    p-checkBox.ng-invalid.ng-dirty .p-checkbox-box,
    p-check-box.ng-invalid.ng-dirty .p-checkbox-box,
    p-checkbox.ng-invalid.ng-dirty .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-checkbox p-component',
        {
            'p-checkbox-checked p-highlight': instance.checked,
            'p-disabled': instance.$disabled(),
            'p-invalid': instance.invalid(),
            'p-variant-filled': instance.$variant() === 'filled',
            'p-checkbox-sm p-inputfield-sm': instance.size() === 'small',
            'p-checkbox-lg p-inputfield-lg': instance.size() === 'large'
        }
    ],
    box: 'p-checkbox-box',
    input: 'p-checkbox-input',
    icon: 'p-checkbox-icon'
};

@Injectable()
export class CheckboxStyle extends BaseStyle {
    name = 'checkbox';

    style = style;

    classes = classes;
}

/**
 *
 * Checkbox is an extension to standard checkbox element with theming.
 *
 * [Live Demo](https://www.primeng.org/checkbox/)
 *
 * @module checkboxstyle
 *
 */
export enum CheckboxClasses {
    /**
     * Class name of the root element
     */
    root = 'p-checkbox',
    /**
     * Class name of the box element
     */
    box = 'p-checkbox-box',
    /**
     * Class name of the input element
     */
    input = 'p-checkbox-input',
    /**
     * Class name of the icon element
     */
    icon = 'p-checkbox-icon'
}

export interface CheckboxStyle extends BaseStyle {}
