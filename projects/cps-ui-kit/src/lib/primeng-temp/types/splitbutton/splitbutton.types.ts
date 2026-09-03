// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/splitbutton/splitbutton.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { ButtonPassThrough } from '../button/public_api';
import { MenuPassThrough } from '../menu/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link SplitButton.pt}
 * @group Interface
 */
export interface SplitButtonPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLDivElement, I>;
    /**
     * Used to pass attributes to the Button component.
     * @see {@link ButtonPassThrough}
     */
    pcButton?: ButtonPassThrough;
    /**
     * Used to pass attributes to the dropdown Button component.
     * @see {@link ButtonPassThrough}
     */
    pcDropdown?: ButtonPassThrough;
    /**
     * Used to pass attributes to the TieredMenu component.
     */
    pcMenu?: MenuPassThrough;
}

/**
 * Defines valid pass-through options in SplitButton component.
 * @see {@link SplitButtonPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type SplitButtonPassThrough<I = unknown> = PassThrough<I, SplitButtonPassThroughOptions<I>>;

/**
 * Defines valid templates in SplitButton.
 * @group Templates
 */
export interface SplitButtonTemplates {
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom dropdown icon template.
     */
    dropdownicon(): TemplateRef<void>;
}
/**
 * Defines ButtonProps interface.
 */
export interface ButtonProps {
    ariaLabel?: string;
}
/**
 * Defines MenuButtonProps interface.
 */
export interface MenuButtonProps {
    ariaLabel?: string;
    ariaHasPopup?: boolean;
    ariaExpanded?: boolean;
    ariaControls?: string;
}
