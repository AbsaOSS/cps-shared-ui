// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/timeline/timeline.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Timeline.pt}
 * @group Interface
 */
export interface TimelinePassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event's DOM element.
     */
    event?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event opposite's DOM element.
     */
    eventOpposite?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event separator's DOM element.
     */
    eventSeparator?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event marker's DOM element.
     */
    eventMarker?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event connector's DOM element.
     */
    eventConnector?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the event content's DOM element.
     */
    eventContent?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in Timeline.
 * @see {@link TimelinePassThroughOptions}
 *
 * @template I Type of instance.
 */
export type TimelinePassThrough<I = unknown> = PassThrough<I, TimelinePassThroughOptions<I>>;

/**
 * Custom item template context.
 * @template T Type of item.
 * @group Interface
 */
export interface TimelineItemTemplateContext<T = any> {
    /**
     * Item instance.
     */
    $implicit: T;
}

/**
 * Defines valid templates in Timeline.
 * @group Templates
 */
export interface TimelineTemplates<T = any> {
    /**
     * Custom content template.
     * @param {TimelineItemTemplateContext} context - item data.
     */
    content(context: TimelineItemTemplateContext<T>): TemplateRef<TimelineItemTemplateContext<T>>;
    /**
     * Custom opposite item template.
     * @param {TimelineItemTemplateContext} context - item data.
     */
    opposite(context: TimelineItemTemplateContext<T>): TemplateRef<TimelineItemTemplateContext<T>>;
    /**
     * Custom marker template.
     * @param {TimelineItemTemplateContext} context - item data.
     */
    marker(context: TimelineItemTemplateContext<T>): TemplateRef<TimelineItemTemplateContext<T>>;
}
