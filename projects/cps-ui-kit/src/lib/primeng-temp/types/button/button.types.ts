// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/types/button/button.types.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { TemplateRef } from '@angular/core';
import type { PassThrough, PassThroughOption } from '../../api/public_api';
import type { BadgePassThrough } from '../badge/public_api';

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link Button.pt}
 * @group Interface
 */
export interface ButtonPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLButtonElement, I>;
    /**
     * Used to pass attributes to the loading icon's DOM element.
     */
    loadingIcon?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the icon's DOM element.
     */
    icon?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the label's DOM element.
     */
    label?: PassThroughOption<HTMLSpanElement, I>;
    /**
     * Used to pass attributes to the Badge component.
     */
    pcBadge?: BadgePassThrough;
}

/**
 * Defines valid pass-through options in Button component.
 * @see {@link ButtonPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ButtonPassThrough<I = unknown> = PassThrough<I, ButtonPassThroughOptions<I>>;

/**
 * Custom icon template context.
 * @group Interface
 */
export interface ButtonIconTemplateContext {
    /**
     * Style class of the icon.
     */
    class: string;
    /**
     * Pass-through options for the icon element.
     */
    pt: any;
}

/**
 * Custom loading icon template context.
 * @group Interface
 */
export interface ButtonLoadingIconTemplateContext {
    /**
     * Style class of the loading icon.
     */
    class: string;
    /**
     * Pass-through options for the loading icon element.
     */
    pt: any;
}

/**
 * Defines valid templates in Button.
 * @group Templates
 */
export interface ButtonTemplates {
    /**
     * Custom content template.
     */
    content(): TemplateRef<void>;
    /**
     * Custom icon template.
     * @param {Object} context - icon context.
     */
    icon(context: ButtonIconTemplateContext): TemplateRef<ButtonIconTemplateContext>;
    /**
     * Custom loading icon template.
     * @param {Object} context - loading icon context.
     */
    loadingicon(context: ButtonLoadingIconTemplateContext): TemplateRef<ButtonLoadingIconTemplateContext>;
}

type ButtonIconPosition = 'left' | 'right' | 'top' | 'bottom';

export interface ButtonProps {
    type?: string;
    iconPos?: ButtonIconPosition;
    icon?: string | undefined;
    badge?: string | undefined;
    label?: string | undefined;
    disabled?: boolean | undefined;
    loading?: boolean;
    loadingIcon?: string | undefined;
    raised?: boolean;
    rounded?: boolean;
    text?: boolean;
    plain?: boolean;
    severity?: ButtonSeverity;
    outlined?: boolean;
    link?: boolean;
    tabindex?: number | undefined;
    size?: 'small' | 'large' | undefined;
    style?: { [klass: string]: any } | null | undefined;
    styleClass?: string | undefined;
    badgeClass?: string | undefined;
    badgeSeverity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined;
    ariaLabel?: string | undefined;
    autofocus?: boolean | undefined;
    variant?: string | undefined;
}

export type ButtonSeverity = 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined;
