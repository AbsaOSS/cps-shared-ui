// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/fieldset/fieldset.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { MotionOptions } from '../../../primeuix-temp/motion/src/index';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom passthrough(pt) options.
 * @see {@link Fieldset.pt}
 * @group Interface
 */
export interface FieldsetPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLFieldSetElement, I>;
    /**
     * Used to pass attributes to the legend's DOM element.
     */
    legend?: PassThroughOption<HTMLLegendElement, I>;
    /**
     * Used to pass attributes to the toggle button's DOM element.
     */
    toggleButton?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the toggle icon's DOM element.
     */
    toggleIcon?: PassThroughOption<SVGElement | HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the legend label's DOM element.
     */
    legendLabel?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the content container's DOM element.
     */
    contentContainer?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content wrapper DOM element.
     */
    contentWrapper?: PassThroughOption<HTMLDivElement, I>;
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
 * Defines valid pass-through options in Fieldset component.
 * @see {@link FieldsetPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type FieldsetPassThrough<I = unknown> = PassThrough<I, FieldsetPassThroughOptions<I>>;

/**
 * Custom panel toggle event, emits after toggle.
 * @see {@link Fieldset.onAfterToggle}
 * @group Events
 */
export interface FieldsetAfterToggleEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Collapsed state of the panel.
     */
    collapsed: boolean | undefined;
}

/**
 * Custom panel toggle event, emits before toggle.
 * @see {@link Fieldset.onBeforeToggle}
 * @extends {FieldsetAfterToggleEvent}
 * @group Events
 */
export interface FieldsetBeforeToggleEvent extends FieldsetAfterToggleEvent {}

/**
 * Defines valid templates in Fieldset.
 * @group Templates
 */
export interface FieldsetTemplates {
    /**
     * Custom header template.
     */
    header(): TemplateRef<void>;
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom expand icon template.
     */
    expandicon(): TemplateRef<void>;
    /**
     * Custom collapse icon template.
     */
    collapseicon(): TemplateRef<void>;
}
