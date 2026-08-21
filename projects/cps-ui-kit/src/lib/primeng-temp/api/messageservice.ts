// @ts-nocheck -- vendored third-party source, see provenance note below.
/**
 * Vendored from PrimeNG 21.1.9 (https://github.com/primefaces/primeng, tag 21.1.9, commit c493b1c6d9f7cdffbe1c4dc195493dd73d733593).
 * Original file: packages/primeng/src/api/messageservice.ts
 * Modified: import paths rewritten to resolve locally; // @ts-nocheck added because this
 * repository's TypeScript config is stricter than PrimeNG's own (strict, noImplicitOverride,
 * noUnusedLocals/Parameters, etc.). No runtime logic was changed. See ../NOTICE.md.
 * Original license: MIT, Copyright (c) 2016-2026 PrimeTek.
 */
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastMessageOptions } from './toastmessage';
/**
 * Message service used in messages and toast components.
 * @group Service
 */
@Injectable()
export class MessageService {
    private messageSource = new Subject<ToastMessageOptions | ToastMessageOptions[]>();
    private clearSource = new Subject<string | null>();

    messageObserver = this.messageSource.asObservable();
    clearObserver = this.clearSource.asObservable();
    /**
     * Inserts single message.
     * @param {ToastMessageOptions} message - Message to be added.
     * @group Method
     */
    add(message: ToastMessageOptions) {
        if (message) {
            this.messageSource.next(message);
        }
    }
    /**
     * Inserts new messages.
     * @param {Message[]} messages - Messages to be added.
     * @group Method
     */
    addAll(messages: ToastMessageOptions[]) {
        if (messages && messages.length) {
            this.messageSource.next(messages);
        }
    }
    /**
     * Clears the message with the given key.
     * @param {string} key - Key of the message to be cleared.
     * @group Method
     */
    clear(key?: string) {
        this.clearSource.next(key || null);
    }
}
