// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/togglebutton/style/togglebuttonstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as togglebutton_style } from '../../../primeuix-temp/styles/src/togglebutton/index';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${togglebutton_style}

    /* For PrimeNG (iconPos) */
    .p-togglebutton-icon-right {
        order: 1;
    }

    .p-togglebutton.ng-invalid.ng-dirty {
        border-color: dt('togglebutton.invalid.border.color');
    }
`;

const classes = {
    root: ({ instance }) => [
        'p-togglebutton p-component',
        {
            'p-togglebutton-checked': instance.checked,
            'p-invalid': instance.invalid(),
            'p-disabled': instance.$disabled(),
            'p-togglebutton-sm p-inputfield-sm': instance.size === 'small',
            'p-togglebutton-lg p-inputfield-lg': instance.size === 'large',
            'p-togglebutton-fluid': instance.fluid()
        }
    ],
    content: 'p-togglebutton-content',
    icon: 'p-togglebutton-icon',
    iconLeft: 'p-togglebutton-icon-left',
    iconRight: 'p-togglebutton-icon-right',
    label: 'p-togglebutton-label'
};

@Injectable()
export class ToggleButtonStyle extends BaseStyle {
    name = 'togglebutton';

    style = style;

    classes = classes;
}

/**
 *
 * ToggleButton is used to select a boolean value using a button.
 *
 * [Live Demo](https://www.primeng.org/togglebutton/)
 *
 * @module togglebuttonstyle
 *
 */
export enum ToggleButtonClasses {
    /**
     * Class name of the root element
     */
    root = 'p-togglebutton',
    /**
     * Class name of the icon element
     */
    icon = 'p-togglebutton-icon',
    /**
     * Class name of the left icon
     */
    iconLeft = 'p-togglebutton-icon-left',
    /**
     * Class name of the right icon
     */
    iconRight = 'p-togglebutton-icon-right',
    /**
     * Class name of the label element
     */
    label = 'p-togglebutton-label'
}

export interface ToggleButtonStyle extends BaseStyle {}
