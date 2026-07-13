// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/badge/style/badgestyle.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { style as badge_style } from '@primeuix/styles/badge';
import { isEmpty, isNotEmpty } from '@primeuix/utils';
import { BaseStyle } from '../../base/public_api';

const style = /*css*/ `
    ${badge_style}

    /* For PrimeNG (directive)*/
    .p-overlay-badge {
        position: relative;
    }

    .p-overlay-badge > .p-badge {
        position: absolute;
        top: 0;
        inset-inline-end: 0;
        transform: translate(50%, -50%);
        transform-origin: 100% 0;
        margin: 0;
    }
`;

const classes = {
    root: ({ instance }) => {
        const value = typeof instance.value === 'function' ? instance.value() : instance.value;
        const size = typeof instance.size === 'function' ? instance.size() : instance.size;
        const badgeSize = typeof instance.badgeSize === 'function' ? instance.badgeSize() : instance.badgeSize;
        const severity = typeof instance.severity === 'function' ? instance.severity() : instance.severity;

        return [
            'p-badge p-component',
            {
                'p-badge-circle': isNotEmpty(value) && String(value).length === 1,
                'p-badge-dot': isEmpty(value),
                'p-badge-sm': size === 'small' || badgeSize === 'small',
                'p-badge-lg': size === 'large' || badgeSize === 'large',
                'p-badge-xl': size === 'xlarge' || badgeSize === 'xlarge',
                'p-badge-info': severity === 'info',
                'p-badge-success': severity === 'success',
                'p-badge-warn': severity === 'warn',
                'p-badge-danger': severity === 'danger',
                'p-badge-secondary': severity === 'secondary',
                'p-badge-contrast': severity === 'contrast'
            }
        ];
    }
};

@Injectable()
export class BadgeStyle extends BaseStyle {
    name = 'badge';

    style = style;

    classes = classes;
}

/**
 *
 * Badge represents people using icons, labels and images.
 *
 * [Live Demo](https://www.primeng.org/badge)
 *
 * @module badgestyle
 *
 */
export enum BadgeClasses {
    /**
     * Class name of the root element
     */
    root = 'p-badge'
}

export interface BadgeStyle extends BaseStyle {}
