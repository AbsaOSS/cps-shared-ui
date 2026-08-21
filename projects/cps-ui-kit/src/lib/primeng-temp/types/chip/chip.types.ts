// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/chip/chip.types.ts
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
 * @see {@link Chip.pt}
 * @group Interface
 */
export interface ChipPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the image's DOM element.
     */
    image?: PassThroughOption<HTMLImageElement, I>;
    /**
     * Used to pass attributes to the icon's DOM element.
     */
    icon?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the label's DOM element.
     */
    label?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the remove icon's DOM element.
     */
    removeIcon?: PassThroughOption<HTMLElement, I>;
}

/**
 * Defines valid pass-through options in Chip component.
 * @see {@link ChipPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ChipPassThrough<I = unknown> = PassThrough<I, ChipPassThroughOptions<I>>;

/**
 * Defines valid templates in Chip.
 * @group Templates
 */
export interface ChipTemplates {
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom remove icon template.
     */
    removeicon(): TemplateRef<void>;
}

export interface ChipProps {
    label?: string;
    icon?: string | undefined;
    image?: string | undefined;
    alt?: string | undefined;
    style?: { [klass: string]: any } | null | undefined;
    styleClass?: string | undefined;
    removable?: boolean | undefined;
    removeIcon?: string | undefined;
}
