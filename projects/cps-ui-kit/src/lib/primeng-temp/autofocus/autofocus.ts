// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/autofocus/autofocus.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, Input, NgModule, PLATFORM_ID } from '@angular/core';
import { BaseComponent } from '../basecomponent/public_api';
import { DomHandler } from '../dom/public_api';

/**
 * AutoFocus manages focus on focusable element on load.
 * @group Components
 */
@Directive({
    selector: '[pAutoFocus]',
    standalone: true
})
export class AutoFocus extends BaseComponent {
    /**
     * When present, it specifies that the component should automatically get focus on load.
     * @group Props
     */
    @Input('pAutoFocus') autofocus: boolean | undefined = false;

    focused: boolean = false;

    platformId = inject(PLATFORM_ID);

    document: Document = inject(DOCUMENT);

    host: ElementRef = inject(ElementRef);

    onAfterContentChecked() {
        // This sets the `attr.autofocus` which is different than the Input `autofocus` attribute.
        if (this.autofocus === false) {
            this.host.nativeElement.removeAttribute('autofocus');
        } else {
            this.host.nativeElement.setAttribute('autofocus', true);
        }

        if (!this.focused) {
            this.autoFocus();
        }
    }

    onAfterViewChecked() {
        if (!this.focused) {
            this.autoFocus();
        }
    }

    autoFocus() {
        if (isPlatformBrowser(this.platformId) && this.autofocus) {
            setTimeout(() => {
                const focusableElements = DomHandler.getFocusableElements(this.host?.nativeElement);

                if (focusableElements.length === 0) {
                    this.host.nativeElement.focus();
                }
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }

                this.focused = true;
            });
        }
    }
}

@NgModule({
    imports: [AutoFocus],
    exports: [AutoFocus]
})
export class AutoFocusModule {}
