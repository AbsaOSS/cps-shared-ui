// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/baseinput/baseinput.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { booleanAttribute, computed, Directive, inject, input } from '@angular/core';
import { BaseEditableHolder } from '../baseeditableholder/public_api';
import { Fluid } from '../fluid/public_api';

@Directive({ standalone: true })
export class BaseInput<PT = any> extends BaseEditableHolder<PT> {
    pcFluid: Fluid | null = inject(Fluid, { optional: true, host: true, skipSelf: true });

    /**
     * Spans 100% width of the container when enabled.
     * @defaultValue false
     * @group Props
     */
    fluid = input(undefined, { transform: booleanAttribute });
    /**
     * Specifies the input variant of the component.
     * @defaultValue 'outlined'
     * @group Props
     */
    variant = input<'filled' | 'outlined' | undefined>();
    /**
     * Specifies the size of the component.
     * @defaultValue undefined
     * @group Props
     */
    size = input<'large' | 'small' | undefined>();
    /**
     * Specifies the visible width of the input element in characters.
     * @defaultValue undefined
     * @group Props
     */
    inputSize = input<number | null | undefined>();
    /**
     * Specifies the value must match the pattern.
     * @defaultValue undefined
     * @group Props
     */
    pattern = input<string | null | undefined>();
    /**
     * The value must be greater than or equal to the value.
     * @defaultValue undefined
     * @group Props
     */
    min = input<number | null | undefined>();
    /**
     * The value must be less than or equal to the value.
     * @defaultValue undefined
     * @group Props
     */
    max = input<number | null | undefined>();
    /**
     * Unless the step is set to the any literal, the value must be min + an integral multiple of the step.
     * @defaultValue undefined
     * @group Props
     */
    step = input<number | null | undefined>();
    /**
     * The number of characters (code points) must not be less than the value of the attribute, if non-empty.
     * @defaultValue undefined
     * @group Props
     */
    minlength = input<number | null | undefined>();
    /**
     * The number of characters (code points) must not exceed the value of the attribute.
     * @defaultValue undefined
     * @group Props
     */
    maxlength = input<number | null | undefined>();

    $variant = computed(() => this.variant() || this.config.inputStyle() || this.config.inputVariant());

    get hasFluid() {
        return this.fluid() ?? !!this.pcFluid;
    }
}
