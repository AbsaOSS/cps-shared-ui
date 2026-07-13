// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/inputmask/inputmask.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { InputTextPassThrough } from '../inputtext/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link InputMask.pt}
 * @group Interface
 */
export interface InputMaskPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLInputElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLInputElement, I>;
    /**
     * Used to pass attributes to the InputText component.
     */
    pcInputText?: InputTextPassThrough;
    /**
     * Used to pass attributes to the clear icon's DOM element.
     */
    clearIcon?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in InputMask.
 * @see {@link InputMaskPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type InputMaskPassThrough<I = unknown> = PassThrough<I, InputMaskPassThroughOptions<I>>;

/**
 * Caret positions.
 * @group Types
 */
export type Caret = { begin: number; end: number };
/**
 * Defines valid templates in InputMask.
 * @group Templates
 */
export interface InputMaskTemplates {
    /**
     * Custom clear icon template.
     */
    clearicon(): TemplateRef<void>;
}
