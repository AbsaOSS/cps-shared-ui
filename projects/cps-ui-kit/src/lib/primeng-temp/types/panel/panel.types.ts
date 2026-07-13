// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/panel/panel.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import type { TemplateRef } from '@angular/core';
import type { MotionOptions } from '@primeuix/motion';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ButtonPassThrough } from '../button/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Panel.pt}
 * @group Interface
 */
export interface PanelPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the header's DOM element.
     */
    header?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the title's DOM element.
     */
    title?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the header actions' DOM element.
     */
    headerActions?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the toggle button button's DOM element.
     * @see {@link ButtonPassThroughOptions}
     */
    pcToggleButton?: ButtonPassThrough;
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
     * Used to pass attributes to the footer's DOM element.
     */
    footer?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass options to the motion component/directive.
     */
    motion?: MotionOptions;
}

/**
 * Defines valid pass-through options in Panel component.
 * @see {@link PanelPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type PanelPassThrough<I = unknown> = PassThrough<I, PanelPassThroughOptions<I>>;

/**
 * Custom panel toggle event, emits before panel toggle.
 * @see {@link onBeforeToggle}
 * @group Interface
 */
export interface PanelBeforeToggleEvent {
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
 * Custom panel toggle event, emits after panel toggle.
 * @see {@link onAfterToggle}
 * @extends {PanelBeforeToggleEvent}
 * @group Interface
 */
export interface PanelAfterToggleEvent extends PanelBeforeToggleEvent {}

/**
 * Toggle icon template context.
 * @param {boolean} $implicit - Collapsed state as a boolean, implicit value.
 * @group Interface
 */
export interface PanelHeaderIconsTemplateContext {
    /**
     * Collapsed state as a boolean, implicit value.
     */
    $implicit: boolean;
}

/**
 * Defines valid templates in Panel.
 * @group Templates
 */
export interface PanelTemplates {
    /**
     * Custom header template.
     */
    header(): TemplateRef<void>;
    /**
     * Custom icons template.
     */
    icons(): TemplateRef<void>;
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom footer template.
     */
    footer(): TemplateRef<void>;
    /**
     * Custom header icons template.
     * @param {PanelHeaderIconsTemplateContext} context - header icons context.
     */
    headericons(context: PanelHeaderIconsTemplateContext): TemplateRef<PanelHeaderIconsTemplateContext>;
}
