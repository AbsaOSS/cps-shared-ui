// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/card/card.types.ts
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
 * @see {@link Card.pt}
 * @group Interface
 */
export interface CardPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the header's DOM element.
     */
    header?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the body's DOM element.
     */
    body?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the subtitle's DOM element.
     */
    subtitle?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the title's DOM element.
     */
    title?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the footer's DOM element.
     */
    footer?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in Card component.
 * @see {@link CardPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type CardPassThrough<I = unknown> = PassThrough<I, CardPassThroughOptions<I>>;

/**
 * Defines valid templates in Card.
 * @group Templates
 */
export interface CardTemplates {
    /**
     * Custom header template.
     */
    header(): TemplateRef<void>;
    /**
     * Custom title template.
     */
    title(): TemplateRef<void>;
    /**
     * Custom subtitle template.
     */
    subtitle(): TemplateRef<void>;
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom footer template.
     */
    footer(): TemplateRef<void>;
}
