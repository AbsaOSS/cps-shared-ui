// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/confirmation.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { EventEmitter } from '@angular/core';

/**
 * Represents a confirmation dialog configuration.
 * @group Interface
 */
export interface Confirmation {
    /**
     * The message to be displayed in the confirmation dialog.
     */
    message?: string;
    /**
     * A unique key to identify the confirmation dialog.
     */
    key?: string;
    /**
     * The name of the icon to be displayed in the confirmation dialog.
     */
    icon?: string;
    /**
     * The header text of the confirmation dialog.
     */
    header?: string;
    /**
     * The callback function to be executed when the accept button is clicked.
     */
    accept?: Function;
    /**
     * The callback function to be executed when the reject button is clicked.
     */
    reject?: Function;
    /**
     * The label text for the accept button.
     */
    acceptLabel?: string;
    /**
     * The label text for the reject button.
     */
    rejectLabel?: string;
    /**
     * The name of the icon to be displayed on the accept button.
     */
    acceptIcon?: string;
    /**
     * The name of the icon to be displayed on the reject button.
     */
    rejectIcon?: string;
    /**
     * Specifies whether the accept button should be visible.
     */
    acceptVisible?: boolean;
    /**
     * Specifies whether the reject button should be visible.
     */
    rejectVisible?: boolean;
    /**
     * Specifies whether to block scrolling on the page when the confirmation dialog is displayed.
     */
    blockScroll?: boolean;
    /**
     * Specifies whether the confirmation dialog should be closed when the escape key is pressed.
     */
    closeOnEscape?: boolean;
    /**
     * Specifies whether clicking outside the confirmation dialog should dismiss it.
     */
    dismissableMask?: boolean;
    /**
     * The ID or class name of the element to receive focus by default when the confirmation dialog is opened.
     */
    defaultFocus?: string;
    /**
     * The CSS class name to be applied to the accept button.
     */
    acceptButtonStyleClass?: string;
    /**
     * The CSS class name to be applied to the reject button.
     */
    rejectButtonStyleClass?: string;
    /**
     * The target event where the confirmation dialog is triggered from.
     */
    target?: EventTarget;
    /**
     * An event emitter for the accept event.
     */
    acceptEvent?: EventEmitter<any>;
    /**
     * An event emitter for the reject event.
     */
    rejectEvent?: EventEmitter<any>;
    /**
     * Accept button properties.
     */
    acceptButtonProps?: any;
    /**
     * Reject button properties.
     */
    rejectButtonProps?: any;
    /**
     * Close button properties.
     */
    closeButtonProps?: any;
    /**
     * Defines if the dialog is closable.
     */
    closable?: boolean;
    /**
     * Defines the dialog position.
     */
    position?: string;
    /**
     * Specifies whether the dialog displayed as modal or not.
     * @defaultValue true
     */
    modal?: boolean;
}
