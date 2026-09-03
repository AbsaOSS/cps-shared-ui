// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/scrollpanel/scrollpanel.types.ts
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
 * @see {@link ScrollPanel.pt}
 * @group Interface
 */
export interface ScrollPanelPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content container's DOM element.
     */
    contentContainer?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the content's DOM element.
     */
    content?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the horizontal panel's DOM element.
     */
    barX?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the vertical panel's DOM element.
     */
    barY?: PassThroughOption<HTMLDivElement, I>;
}

/**
 * Defines valid pass-through options in ScrollPanel component.
 * @see {@link ScrollPanelPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ScrollPanelPassThrough<I = unknown> = PassThrough<I, ScrollPanelPassThroughOptions<I>>;

/**
 * Defines valid templates in ScrollPanel.
 * @group Templates
 */
export interface ScrollPanelTemplates {
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
}
