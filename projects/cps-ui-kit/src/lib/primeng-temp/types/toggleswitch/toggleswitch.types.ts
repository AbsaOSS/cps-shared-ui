// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/toggleswitch/toggleswitch.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom passthrough(pt) options.
 * @template I Type of instance.
 *
 * @see {@link ToggleSwitch.pt}
 * @group Interface
 */
export interface ToggleSwitchPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the input's DOM element.
     */
    input?: PassThroughOption<HTMLInputElement, I>;
    /**
     * Used to pass attributes to the slider's DOM element.
     */
    slider?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the handle's DOM element.
     */
    handle?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in ToggleSwitch component.
 * @see {@link ToggleSwitchPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ToggleSwitchPassThrough<I = unknown> = PassThrough<I, ToggleSwitchPassThroughOptions<I>>;

/**
 * Custom change event.
 * @see {@link ToggleSwitch.onChange}
 * @group Events
 */
export interface ToggleSwitchChangeEvent {
    /**
     * Browser event
     */
    originalEvent: Event;
    /**
     * Checked state as a boolean.
     */
    checked: boolean;
}

/**
 * Custom handle template context.
 * @group Interface
 */
export interface ToggleSwitchHandleTemplateContext {
    /**
     * Checked state of the toggle switch.
     */
    checked: boolean;
}

/**
 * Defines valid templates in ToggleSwitch.
 * @group Templates
 */
export interface ToggleSwitchTemplates {
    /**
     * Custom handle template.
     * @param {ToggleSwitchHandleTemplateContext} context - handle context.
     */
    handle(context: ToggleSwitchHandleTemplateContext): TemplateRef<ToggleSwitchHandleTemplateContext>;
}
