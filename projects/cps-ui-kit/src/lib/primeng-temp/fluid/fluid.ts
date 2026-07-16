// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/fluid/fluid.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, InjectionToken, NgModule, ViewEncapsulation } from '@angular/core';
import { BaseComponent, PARENT_INSTANCE } from '../basecomponent/public_api';
import { Bind } from '../bind/public_api';
import { FluidPassThrough } from '../types/fluid/public_api';
import { FluidStyle } from './style/fluidstyle';

const FLUID_INSTANCE = new InjectionToken<Fluid>('FLUID_INSTANCE');

/**
 * Fluid is a layout component to make descendant components span full width of their container.
 * @group Components
 */
@Component({
    selector: 'p-fluid',
    template: ` <ng-content></ng-content> `,
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [FluidStyle, { provide: FLUID_INSTANCE, useExisting: Fluid }, { provide: PARENT_INSTANCE, useExisting: Fluid }],
    host: {
        '[class]': "cx('root')"
    },
    hostDirectives: [Bind]
})
export class Fluid extends BaseComponent<FluidPassThrough> {
    componentName = 'Fluid';

    $pcFluid: Fluid | undefined = inject(FLUID_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    bindDirectiveInstance = inject(Bind, { self: true });

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
    }

    _componentStyle = inject(FluidStyle);
}

@NgModule({
    imports: [Fluid],
    exports: [Fluid]
})
export class FluidModule {}
