// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/config/provideprimeng.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { PrimeNG } from './primeng';
import type { PrimeNGConfigType } from './primeng.types';

export const PRIME_NG_CONFIG = new InjectionToken<PrimeNGConfigType>('PRIME_NG_CONFIG');

export function providePrimeNG(...features: PrimeNGConfigType[]): EnvironmentProviders {
    const providers = features?.map((feature) => ({
        provide: PRIME_NG_CONFIG,
        useValue: feature,
        multi: false
    }));

    const initializer = provideAppInitializer(() => {
        const PrimeNGConfig = inject(PrimeNG);
        features?.forEach((feature) => PrimeNGConfig.setConfig(feature));
        return;
    });

    return makeEnvironmentProviders([...providers, initializer]);
}
