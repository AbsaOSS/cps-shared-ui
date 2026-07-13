// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/stepper/stepper.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { MotionOptions } from '@primeuix/motion';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Defines valid pass-through options in Stepper component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepperPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Defines valid pass-through options in Stepper component.
 * @see {@link StepperPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepperPassThrough<I = unknown> = PassThrough<I, StepperPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in StepList component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepListPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in StepList component.
 * @see {@link StepListPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepListPassThrough<I = unknown> = PassThrough<I, StepListPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in StepperSeparator component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepperSeparatorPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the separator's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in StepperSeparator component.
 * @see {@link StepperSeparatorPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepperSeparatorPassThrough<I = unknown> = PassThrough<I, StepperSeparatorPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in StepItem component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepItemPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in StepItem component.
 * @see {@link StepItemPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepItemPassThrough<I = unknown> = PassThrough<I, StepItemPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in Step component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the header's DOM element.
     */
    header?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the number's DOM element.
     */
    number?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the title's DOM element.
     */
    title?: PassThroughOption<HTMLSpanElement, I>;
}

/**
 * Defines valid pass-through options in Step component.
 * @see {@link StepPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepPassThrough<I = unknown> = PassThrough<I, StepPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in StepPanel component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepPanelPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the content wrapper DOM element.
     */
    contentWrapper?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in StepPanel component.
 * @see {@link StepPanelPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepPanelPassThrough<I = unknown> = PassThrough<I, StepPanelPassThroughOptions<I>>;

/**
 * Defines valid pass-through options in StepPanels component.
 * @template I Type of instance.
 *
 * @group Interface
 */
export interface StepPanelsPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in StepPanels component.
 * @see {@link StepPanelsPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type StepPanelsPassThrough<I = unknown> = PassThrough<I, StepPanelsPassThroughOptions<I>>;
