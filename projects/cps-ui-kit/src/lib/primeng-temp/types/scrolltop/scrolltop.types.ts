// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/scrolltop/scrolltop.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { MotionOptions } from '../../../primeuix-temp/motion/src/index';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ButtonPassThrough } from '../button/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link ScrollTop.pt}
 * @group Interface
 */
export interface ScrollTopPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the Button component.
     * @see {@link ButtonPassThrough}
     */
    pcButton?: ButtonPassThrough;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Defines valid pass-through options in ScrollTop.
 * @see {@link ScrollTopPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ScrollTopPassThrough<I = unknown> = PassThrough<I, ScrollTopPassThroughOptions<I>>;

/**
 * Custom icon template context.
 * @group Interface
 */
export interface ScrollTopIconTemplateContext {
    /**
     * Style class of the icon.
     */
    styleClass: string;
}

/**
 * Defines valid templates in ScrollTop.
 * @group Templates
 */
export interface ScrollTopTemplates {
    /**
     * Custom icon template.
     * @param {ScrollTopIconTemplateContext} context - icon context.
     */
    icon(context: ScrollTopIconTemplateContext): TemplateRef<ScrollTopIconTemplateContext>;
}
