// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/motion/style/motion.style.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    .p-motion {
        display: block;
    }
`;

const classes = {
    root: 'p-motion'
};

@Injectable()
export class MotionStyle extends BaseStyle {
    name = 'motion';

    style = style;

    classes = classes;
}

/**
 *
 * Motion and MotionDirective provide an easy way to add motion effects to Angular applications.
 *
 * [Live Demo](https://www.primeng.org/motion)
 *
 * @module motionstyle
 *
 */
export enum MotionClasses {
    /**
     * Class name of the root element
     */
    root = 'p-motion'
}

export interface MotionStyle extends BaseStyle {}
