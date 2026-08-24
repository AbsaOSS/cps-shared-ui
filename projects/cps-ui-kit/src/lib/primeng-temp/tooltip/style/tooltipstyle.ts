// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/tooltip/style/tooltipstyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style } from '../../../primeuix-temp/styles/src/tooltip/index';
import { BaseStyle } from '../../base/public_api';

const classes = {
    root: 'p-tooltip p-component',
    arrow: 'p-tooltip-arrow',
    text: 'p-tooltip-text'
};

@Injectable()
export class TooltipStyle extends BaseStyle {
    name = 'tooltip';

    style = style;

    classes = classes;
}

/**
 *
 * Tooltip directive provides advisory information for a component.
 *
 * [Live Demo](https://www.primeng.org/tooltip)
 *
 * @module tooltipstyle
 *
 */
export enum TooltipClasses {
    /**
     * Class name of the root element
     */
    root = 'p-tooltip',
    /**
     * Class name of the arrow element
     */
    arrow = 'p-tooltip-arrow',
    /**
     * Class name of the text element
     */
    text = 'p-tooltip-text'
}

export interface TooltipStyle extends BaseStyle {}
