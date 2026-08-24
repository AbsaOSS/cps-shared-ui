// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/splitter/splitter.types.ts
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
 * @see {@link Splitter.pt}
 * @group Interface
 */
export interface SplitterPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the panel's DOM element.
     */
    panel: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the gutter's DOM element.
     */
    gutter?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the gutter handle's DOM element.
     */
    gutterHandle?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in Splitter component.
 * @see {@link SplitterPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type SplitterPassThrough<I = unknown> = PassThrough<I, SplitterPassThroughOptions<I>>;

/**
 * Custom panel resize start event.
 * @see {@link Splitter.onResizeStart}
 * @group Events
 */
export interface SplitterResizeStartEvent {
    /**
     * Browser event.
     */
    originalEvent: TouchEvent | MouseEvent;
    /**
     * Sizes of the panels, can be percentages, pixels, rem, or other CSS units.
     */
    sizes: (number | string)[];
}
/**
 * Custom panel resize end event.
 * @see {@link Splitter.onResizeEnd}
 * @extends {SplitterResizeStartEvent}
 * @group Events
 */
export interface SplitterResizeEndEvent extends SplitterResizeStartEvent {}

/**
 * Defines valid templates in Splitter.
 * @group Templates
 */
export interface SplitterTemplates {
    /**
     * Custom panel template.
     */
    panel(): TemplateRef<void>;
}
