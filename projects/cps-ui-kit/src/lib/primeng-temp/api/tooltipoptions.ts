// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/tooltipoptions.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { ElementRef, TemplateRef } from '@angular/core';

/**
 * Defines options of Tooltip.
 * @group Interface
 */
export interface TooltipOptions {
    /**
     * Label of tooltip.
     */
    tooltipLabel?: string;
    /**
     * Position of tooltip.
     */
    tooltipPosition?: 'right' | 'left' | 'top' | 'bottom';
    /**
     * Event to show the tooltip.
     */
    tooltipEvent?: 'hover' | 'focus' | 'both';
    /**
     * Target element to attach the overlay, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having #mydiv as variable name).
     * @defaultValue body
     */
    appendTo?: HTMLElement | ElementRef | TemplateRef<any> | string | null | undefined | any;
    /**
     * Type of CSS position.
     */
    positionStyle?: string;
    /**
     * Style class of the tooltip.
     */
    tooltipStyleClass?: string;
    /**
     * Whether the z-index should be managed automatically to always go on top or have a fixed value.
     * @defaultValue auto
     */
    tooltipZIndex?: string;
    /**
     * By default the tooltip contents are rendered as text. Set to false to support html tags in the content.
     */
    escape?: boolean;
    /**
     * When present, it specifies that the component should be disabled.
     */
    disabled?: boolean;
    /**
     * Specifies the additional vertical offset of the tooltip from its default position.
     */
    positionTop?: number;
    /**
     * Specifies the additional horizontal offset of the tooltip from its default position.
     */
    positionLeft?: number;
    /**
     * Delay to show the tooltip in milliseconds.
     */
    showDelay?: number;
    /**
     * Delay to hide the tooltip in milliseconds.
     */
    hideDelay?: number;
    /**
     * Time to wait in milliseconds to hide the tooltip even it is active.
     */
    life?: number;
    /**
     * When present, it adds a custom id to the tooltip.
     */
    id?: string;
}
