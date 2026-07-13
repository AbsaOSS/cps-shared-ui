// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/popover/popover.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { MotionOptions } from '../../../primeuix-temp/motion/src/index';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Popover.pt}
 * @group Interface
 */
export interface PopoverPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Defines valid pass-through options in Popover.
 * @see {@link PopoverPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type PopoverPassThrough<I = unknown> = PassThrough<I, PopoverPassThroughOptions<I>>;

/**
 * Custom content template context.
 * @group Interface
 */
export interface PopoverContentTemplateContext {
    /**
     * Callback to close the popover.
     */
    closeCallback: VoidFunction;
}

/**
 * Defines valid templates in Popover.
 * @group Templates
 */
export interface PopoverTemplates {
    /**
     * Custom template of content.
     * @param {PopoverContentTemplateContext} context - content context.
     */
    content(context: PopoverContentTemplateContext): TemplateRef<PopoverContentTemplateContext>;
}
