import { inject, InjectionToken } from '@angular/core';
import {
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import {
  UWT_LOG_LEVEL_ORDER,
  UwtLogRecord
} from '../../models/uwt-log.models/uwt-log.models';
import { UwtLogQuery } from '../../providers/uwt-log-api.provider/uwt-log-api.provider';
import {
  uwtIsBrowser,
  uwtSafeVoid
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';

/**
 * Default `BroadcastChannel` name used between telemetry realms.
 *
 * @group Utils
 */
export const UWT_DEFAULT_BROADCAST_CHANNEL = 'ngx-ui-watchtower';

/**
 * Overrides the channel name shared by the host and its followers.
 *
 * Both sides must agree. Change it only to run two independent telemetry
 * networks on one origin.
 *
 * @group Tokens
 */
export const UWT_BROADCAST_CHANNEL = new InjectionToken<string>(
  'UWT_BROADCAST_CHANNEL'
);

/**
 * Everything that travels between telemetry realms.
 *
 * Structured-cloned by `BroadcastChannel`, so every payload must be plain
 * data.
 */
export type UwtBroadcastMessage =
  | {
      kind: 'event';
      eventType: string;
      payload: object;
      metadata?: UwtTelemetryMetadata;
    }
  | {
      kind: 'error';
      error: UwtTelemetryError;
      metadata?: UwtTelemetryMetadata;
    }
  | { kind: 'user'; userId: string | undefined }
  | { kind: 'flush'; beacon: boolean }
  | { kind: 'identity-request' }
  /** The host announcing shared identity. Always sends both fields, even when only one changed. */
  | { kind: 'identity'; sessionId?: string; userId?: string }
  /** A follower's log record, for the host to hand to its log API provider. */
  | { kind: 'log'; record: UwtLogRecord }
  /** A follower asking the host to flush its log API provider. */
  | { kind: 'log-flush' }
  /** A follower reading records back through the host's log API provider. */
  | { kind: 'log-query'; id: string; filter: UwtLogQuery }
  /**
   * The host's answer to one `log-query`, matched by `id`. The records come
   * from the host's backend unchecked; the asking follower keeps only those
   * that pass {@link uwtIsBroadcastLogRecord}.
   */
  | { kind: 'log-query-result'; id: string; records: unknown[] };

/** Every `kind` the union above accepts, for {@link uwtIsBroadcastMessage}. */
const MESSAGE_KINDS: ReadonlySet<UwtBroadcastMessage['kind']> = new Set([
  'event',
  'error',
  'user',
  'flush',
  'identity-request',
  'identity',
  'log',
  'log-flush',
  'log-query',
  'log-query-result'
] as const);

const LOG_LEVELS: ReadonlySet<string> = new Set(
  Object.keys(UWT_LOG_LEVEL_ORDER)
);

/** Minimal `BroadcastChannel` surface this library relies on. */
export interface UwtBroadcastChannelLike {
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
export function uwtOpenBroadcastChannel(
  name: string
): UwtBroadcastChannelLike | undefined {
  const Channel = (
    globalThis as {
      BroadcastChannel?: new (name: string) => UwtBroadcastChannelLike;
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

/** Minimal Web Locks API surface this library relies on. */
interface UwtLockManagerLike {
  request(name: string, callback: () => Promise<void>): Promise<void>;
}

/**
 * Elects exactly one leader among same-origin realms on this channel, via
 * the Web Locks API — prevents two shell tabs from both recording every
 * forwarded message. Fails open (elects immediately) when Web Locks is
 * unavailable.
 *
 * @returns releases the lock so the next queued realm can become leader.
 */
export function uwtElectBroadcastHostLeader(
  channelName: string,
  onElected: () => void
): () => void {
  const locks = (globalThis as { navigator?: { locks?: UwtLockManagerLike } })
    .navigator?.locks;

  if (!locks) {
    onElected();
    return () => undefined;
  }

  let released = false;
  let release: () => void = () => {
    released = true;
  };

  const failOpen = () => {
    if (!released) {
      onElected();
    }
  };

  try {
    locks
      .request(
        `ngx-ui-watchtower-host:${channelName}`,
        () =>
          new Promise<void>((resolve) => {
            if (released) {
              resolve();
              return;
            }
            release = () => {
              released = true;
              resolve();
            };
            onElected();
          })
      )
      .catch(failOpen);
  } catch {
    failOpen();
  }

  return () => release();
}

/** A realm's live connection to the shared broadcast channel. */
export interface UwtBroadcastConnection {
  /** The channel name actually in use — the injected override, or the default. */
  readonly channelName: string;

  /** Whether a channel is open — false without `BroadcastChannel`, on the server, and once closed. */
  isOpen(): boolean;

  /** Sends a message to every other realm on this channel. No-op if unavailable. */
  post(message: UwtBroadcastMessage): void;

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
export function uwtConnectBroadcastChannel(
  operation: string
): UwtBroadcastConnection {
  const channelName =
    inject(UWT_BROADCAST_CHANNEL, { optional: true }) ??
    UWT_DEFAULT_BROADCAST_CHANNEL;
  let channel = uwtIsBrowser()
    ? uwtOpenBroadcastChannel(channelName)
    : undefined;

  return {
    channelName,
    isOpen() {
      return channel !== undefined;
    },
    post(message) {
      uwtSafeVoid(`${operation}.post`, () => channel?.postMessage(message));
    },
    onMessage(handler) {
      if (channel) {
        channel.onmessage = (event) => handler(event.data);
      }
    },
    close() {
      uwtSafeVoid(`${operation}.close`, () => {
        channel?.close();
        channel = undefined;
      });
    }
  };
}

/**
 * Whether `value` is a valid `metadata` field: absent, or a non-array
 * object whose values are all finite numbers, strings, booleans, or null —
 * the same flat-primitives contract `uwtRedactMetadata` enforces on the way
 * out. Without this, a same-origin sender (not necessarily this library's
 * own sink) could post a nested object on the channel that reaches a
 * receiving sink's own sanitizer — e.g. `UwtRumTelemetrySink.sanitize()` —
 * unchecked, since that step trusts the shape rather than re-validating it.
 */
function isValidBroadcastMetadata(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (v) =>
      v === null ||
      typeof v === 'string' ||
      typeof v === 'boolean' ||
      (typeof v === 'number' && Number.isFinite(v))
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTelemetryError(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.message === 'string' &&
    isOptionalString(value.stack)
  );
}

function isLogLevel(value: unknown): boolean {
  return typeof value === 'string' && LOG_LEVELS.has(value);
}

/**
 * Whether `value` has the shape of a {@link UwtLogRecord}: the required
 * strings, a known level, optional strings where the record has them, and
 * metadata and error held to the same rules as on an `event` or `error`
 * message.
 */
export function uwtIsBroadcastLogRecord(value: unknown): value is UwtLogRecord {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'string' &&
    isLogLevel(value.level) &&
    typeof value.message === 'string' &&
    typeof value.application === 'string' &&
    typeof value.environment === 'string' &&
    typeof value.version === 'string' &&
    isOptionalString(value.logger) &&
    isOptionalString(value.context) &&
    isOptionalString(value.correlationId) &&
    isOptionalString(value.userId) &&
    isOptionalString(value.sessionId) &&
    isValidBroadcastMetadata(value.metadata) &&
    (value.error === undefined || isValidTelemetryError(value.error))
  );
}

function isValidLogQuery(value: unknown): boolean {
  return (
    isRecord(value) &&
    isOptionalString(value.correlationId) &&
    isOptionalString(value.logger) &&
    (value.minLevel === undefined || isLogLevel(value.minLevel)) &&
    isOptionalString(value.from) &&
    isOptionalString(value.to) &&
    (value.limit === undefined ||
      (typeof value.limit === 'number' && Number.isFinite(value.limit)))
  );
}

/**
 * Narrows an incoming `BroadcastChannel` payload to a telemetry message.
 *
 * Checks each kind's required fields, not just `kind`, so a same-named
 * message from something else on the channel is rejected.
 */
export function uwtIsBroadcastMessage(
  data: unknown
): data is UwtBroadcastMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const message = data as Record<string, unknown>;
  const kind = message.kind as UwtBroadcastMessage['kind'];
  if (!MESSAGE_KINDS.has(kind)) {
    return false;
  }

  switch (kind) {
    case 'event':
      return (
        typeof message.eventType === 'string' &&
        typeof message.payload === 'object' &&
        message.payload !== null &&
        isValidBroadcastMetadata(message.metadata)
      );
    case 'error':
      return (
        isValidTelemetryError(message.error) &&
        isValidBroadcastMetadata(message.metadata)
      );
    case 'flush':
      return typeof message.beacon === 'boolean';
    case 'user':
      // Absent or `undefined` userId both mean "clear it".
      return message.userId === undefined || typeof message.userId === 'string';
    case 'identity':
      return (
        (message.sessionId === undefined ||
          typeof message.sessionId === 'string') &&
        (message.userId === undefined || typeof message.userId === 'string')
      );
    case 'identity-request':
    case 'log-flush':
      return true;
    case 'log':
      return uwtIsBroadcastLogRecord(message.record);
    case 'log-query':
      return (
        typeof message.id === 'string' &&
        message.id !== '' &&
        isValidLogQuery(message.filter)
      );
    case 'log-query-result':
      return (
        typeof message.id === 'string' &&
        message.id !== '' &&
        Array.isArray(message.records)
      );
  }
}
