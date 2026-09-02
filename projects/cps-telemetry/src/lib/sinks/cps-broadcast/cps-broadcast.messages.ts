import { inject, InjectionToken } from '@angular/core';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import {
  cpsIsBrowser,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';

/**
 * Default `BroadcastChannel` name used between telemetry realms.
 *
 * @group Utils
 */
export const CPS_DEFAULT_BROADCAST_CHANNEL = 'cps-telemetry';

/**
 * Overrides the channel name shared by the host and its followers.
 *
 * Both sides must agree. Change it only to run two independent telemetry
 * networks on one origin.
 *
 * @group Tokens
 */
export const CPS_BROADCAST_CHANNEL = new InjectionToken<string>(
  'CPS_BROADCAST_CHANNEL'
);

/**
 * Everything that travels between telemetry realms.
 *
 * Structured-cloned by `BroadcastChannel`, so every payload must be plain
 * data.
 */
export type CpsBroadcastMessage =
  | {
      kind: 'event';
      eventType: string;
      payload: object;
      metadata?: CpsTelemetryMetadata;
    }
  | { kind: 'error'; error: CpsTelemetryError }
  | { kind: 'user'; userId: string | undefined }
  | { kind: 'flush'; beacon: boolean }
  | { kind: 'identity-request' }
  /** The host announcing shared identity. Always sends both fields, even when only one changed. */
  | { kind: 'identity'; sessionId?: string; userId?: string };

/** Every `kind` the union above accepts, for {@link cpsIsBroadcastMessage}. */
const MESSAGE_KINDS: ReadonlySet<CpsBroadcastMessage['kind']> = new Set([
  'event',
  'error',
  'user',
  'flush',
  'identity-request',
  'identity'
] as const);

/** Minimal `BroadcastChannel` surface this library relies on. */
export interface CpsBroadcastChannelLike {
  postMessage(message: unknown): void;
  close(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
}

/**
 * Opens a broadcast channel, when the browser provides the API.
 *
 * Feature-detected: unavailable under jsdom (tests) and in server-side
 * rendering.
 */
export function cpsOpenBroadcastChannel(
  name: string
): CpsBroadcastChannelLike | undefined {
  const Channel = (
    globalThis as {
      BroadcastChannel?: new (name: string) => CpsBroadcastChannelLike;
    }
  ).BroadcastChannel;

  if (typeof Channel !== 'function') {
    return undefined;
  }

  try {
    return new Channel(name);
  } catch {
    return undefined;
  }
}

/** A realm's live connection to the shared broadcast channel. */
export interface CpsBroadcastConnection {
  /** The channel name actually in use — the injected override, or the default. */
  readonly channelName: string;

  /** Sends a message to every other realm on this channel. No-op if unavailable. */
  post(message: CpsBroadcastMessage): void;

  /** Registers the handler for incoming messages. No-op if the channel could not be opened. */
  onMessage(handler: (data: unknown) => void): void;

  /** Closes the channel and stops any further delivery. Safe to call more than once. */
  close(): void;
}

/**
 * Opens this realm's connection to the shared broadcast channel: resolves the
 * channel name, feature-detects `BroadcastChannel`, and wraps every operation
 * in the library's fail-open guard.
 *
 * Must be called from an injection context (a field initializer or a
 * constructor).
 */
export function cpsConnectBroadcastChannel(
  operation: string
): CpsBroadcastConnection {
  const channelName =
    inject(CPS_BROADCAST_CHANNEL, { optional: true }) ??
    CPS_DEFAULT_BROADCAST_CHANNEL;
  let channel = cpsIsBrowser()
    ? cpsOpenBroadcastChannel(channelName)
    : undefined;

  return {
    channelName,
    post(message) {
      cpsSafeVoid(`${operation}.post`, () => channel?.postMessage(message));
    },
    onMessage(handler) {
      if (channel) {
        channel.onmessage = (event) => handler(event.data);
      }
    },
    close() {
      cpsSafeVoid(`${operation}.close`, () => {
        channel?.close();
        channel = undefined;
      });
    }
  };
}

/**
 * Narrows an incoming `BroadcastChannel` payload to a telemetry message.
 *
 * Checks each kind's required fields, not just `kind`, so a same-named
 * message from something else on the channel is rejected.
 */
export function cpsIsBroadcastMessage(
  data: unknown
): data is CpsBroadcastMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const message = data as Record<string, unknown>;
  const kind = message.kind as CpsBroadcastMessage['kind'];
  if (!MESSAGE_KINDS.has(kind)) {
    return false;
  }

  switch (kind) {
    case 'event':
      return (
        typeof message.eventType === 'string' &&
        typeof message.payload === 'object' &&
        message.payload !== null
      );
    case 'error': {
      const error = message.error as Record<string, unknown> | undefined;
      return (
        typeof error === 'object' &&
        error !== null &&
        typeof error.name === 'string' &&
        typeof error.message === 'string'
      );
    }
    case 'flush':
      return typeof message.beacon === 'boolean';
    case 'user':
      // Absent or `undefined` userId both mean "clear it".
      return message.userId === undefined || typeof message.userId === 'string';
    case 'identity':
    case 'identity-request':
      return true;
  }
}
