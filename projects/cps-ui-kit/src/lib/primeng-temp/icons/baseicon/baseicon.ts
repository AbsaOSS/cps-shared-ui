// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/icons/baseicon/baseicon.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { cn } from '@primeuix/utils';
import { BaseComponent } from '../../basecomponent/public_api';
import { BaseIconStyle } from './style/baseiconstyle';

@Component({
    template: ` <ng-content></ng-content> `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [BaseIconStyle],
    host: {
        width: '14',
        height: '14',
        viewBox: '0 0 14 14',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        '[class]': 'getClassNames()'
    }
})
export class BaseIcon extends BaseComponent {
    @Input({ transform: booleanAttribute }) spin: boolean = false;

    _componentStyle = inject(BaseIconStyle);

    getClassNames() {
        return cn('p-icon', {
            'p-icon-spin': this.spin
        });
    }
}
