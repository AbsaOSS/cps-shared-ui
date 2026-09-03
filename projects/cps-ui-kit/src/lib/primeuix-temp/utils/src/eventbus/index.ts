/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/utils/src/eventbus/index.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
export type Handler = (evt: unknown) => void;

export interface EventBusOptions {
    on(type: string, handler: Handler): void;
    off(type: string, handler: Handler): void;
    emit(type: string, evt?: unknown): void;
    clear(): void;
}

export function EventBus(): EventBusOptions {
    const allHandlers = new Map<string, Handler[]>();

    return {
        on(type: string, handler: Handler) {
            let handlers = allHandlers.get(type);

            if (!handlers) handlers = [handler];
            else handlers.push(handler);

            allHandlers.set(type, handlers);

            return this;
        },
        off(type: string, handler: Handler) {
            const handlers = allHandlers.get(type);

            if (handlers) {
                handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            }

            return this;
        },
        emit(type: string, evt?: unknown) {
            const handlers = allHandlers.get(type);

            if (handlers) {
                handlers.forEach((handler) => {
                    handler(evt);
                });
            }
        },
        clear() {
            allHandlers.clear();
        }
    };
}
