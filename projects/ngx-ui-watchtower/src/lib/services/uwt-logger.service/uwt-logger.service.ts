import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UWT_LOG_CONFIG } from '../../config/uwt-log.config/uwt-log.config';
import {
  UWT_LOG_LEVEL_ORDER,
  type UwtLogger,
  type UwtLoggerName,
  type UwtLogDetail,
  type UwtLogLevel,
  type UwtLogRecord
} from '../../models/uwt-log.models/uwt-log.models';
import { UwtTelemetryMonitor } from '../uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import {
  UWT_LOG_API_PROVIDER,
  UwtLogQuery
} from '../../providers/uwt-log-api.provider/uwt-log-api.provider';
import { uwtDebugWrite } from '../../utils/uwt-debug-flag.util/uwt-debug-flag.util';
import {
  uwtNormalizeError,
  uwtRedactConfigFor,
  uwtRedactMetadata,
  uwtScrubString
} from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
import {
  uwtIsBrowser,
  uwtSafe,
  uwtSafeVoid,
  uwtSafeVoidMaybeAsync
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';

/**
 * Structured application logging.
 *
 * Log records go to the application's {@link UwtLogApiProvider}, **not** to
 * AWS RUM — RUM is a sampled, session-capped analytics stream, while logs
 * need full fidelity and their own retention.
 *
 * Console output is off unless the `debugLogger` LocalStorage flag is set, in
 * any environment:
 *
 * ```js
 * localStorage.setItem('debugLogger', 'true');
 * ```
 *
 * Every record carries a logger name, so the service itself writes
 * nothing — {@link getLogger} hands back the {@link UwtLogger} you call.
 *
 * @example
 * ```typescript
 * class CheckoutService {
 *   private readonly logger = inject(UwtLoggerService).getLogger('checkout');
 *
 *   load(scenario: UwtScenario) {
 *     try {
 *       // …
 *     } catch (error) {
 *       this.logger.error('Failed to load customer data', {
 *         error,
 *         correlationId: scenario.id
 *       });
 *     }
 *   }
 * }
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class UwtLoggerService implements OnDestroy {
  private readonly identity = inject(UWT_TELEMETRY_IDENTITY);
  private readonly logsConfig = inject(UWT_LOG_CONFIG);
  private readonly redact = uwtRedactConfigFor(
    inject(UWT_REDACT_CONFIG),
    this.logsConfig.redact
  );

  /** Enrichment only (`sessionId`/`userId`, optional RUM mirroring). */
  private readonly sink = inject(UwtTelemetrySink, { optional: true });
  private readonly apiProvider = inject(UWT_LOG_API_PROVIDER);
  private readonly monitor = inject(UwtTelemetryMonitor);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = uwtIsBrowser();

  private readonly onPageHide = () => this.flushProvider();
  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'hidden') {
      this.flushProvider();
    }
  };

  /**
   * One logger per name, so {@link getLogger} is idempotent.
   *
   * Unbounded growth is not a concern the way it is for active scenarios:
   * names come from the closed {@link UwtLoggerNames} vocabulary, so this
   * map is bounded by what the application declared at build time.
   */
  private readonly loggers = new Map<UwtLoggerName, UwtLogger>();

  constructor() {
    if (this.isBrowser) {
      this.document.defaultView?.addEventListener('pagehide', this.onPageHide);

      this.document.addEventListener(
        'visibilitychange',
        this.onVisibilityChange
      );
    }
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.document.defaultView?.removeEventListener(
        'pagehide',
        this.onPageHide
      );
      this.document.removeEventListener(
        'visibilitychange',
        this.onVisibilityChange
      );
    }
    this.flushProvider();
  }

  /**
   * Reads records back from the application's log backend. Useful for
   * pulling one journey together — every line written during a scenario
   * shares its id as the correlation id:
   *
   * @example
   * ```typescript
   * class JourneyService {
   *   private readonly loggerService = inject(UwtLoggerService);
   *
   *   linesOf(scenario: UwtScenario): Promise<UwtLogRecord[]> {
   *     return this.loggerService.query({ correlationId: scenario.id });
   *   }
   * }
   * ```
   *
   * Fail-open: a provider that throws or rejects resolves to `[]`.
   *
   * @param filter narrows what is returned
   * @returns the matching records, or `[]` when none can be read
   */
  async query(filter: UwtLogQuery = {}): Promise<UwtLogRecord[]> {
    const pending = uwtSafe(
      'logger.query',
      () => this.apiProvider.query(filter),
      undefined
    );

    return (await pending?.catch(() => undefined)) ?? [];
  }

  /**
   * Returns the named logger for one part of the application — the only
   * way to write a log record.
   *
   * The name lands on every record as `logger`, and four things key off
   * it: {@link UwtLogConfig.levels} per-logger severity floors, the
   * `debugLogger` flag's comma-separated filter, `query({ logger })`
   * against the log backend, and the console line's prefix. A record
   * without one is reachable by none of them, which is why the service
   * exposes no unnamed `log`/`warn`/`error` of its own.
   *
   * Declare the name in {@link UwtLoggerNames} first, and bind it once as
   * a field:
   *
   * @example
   * ```typescript
   * class CheckoutService {
   *   private readonly logger = inject(UwtLoggerService).getLogger('checkout');
   *
   *   submit() {
   *     this.logger.log('Submitting order');
   *   }
   * }
   * ```
   *
   * The name is identity, not a label: asking twice returns the very same
   * logger, the way a file name always refers to one file.
   *
   * @param name the logger name, declared in {@link UwtLoggerNames}
   * @returns the logger for that name, created once and reused
   */
  getLogger(name: UwtLoggerName): UwtLogger {
    const cached = uwtSafe(
      'logger.getLogger',
      () => this.loggers.get(name),
      undefined
    );
    if (cached) {
      return cached;
    }

    const logger = this.createLogger(name);
    uwtSafeVoid('logger.register', () => this.loggers.set(name, logger));
    return logger;
  }

  /**
   * Builds the logger for one name.
   *
   * Private, and reached only through {@link getLogger}, so every logger
   * handed out is registered and named. The name is captured here rather
   * than read from each call's detail, which is why a record's `logger`
   * cannot disagree with the logger that wrote it.
   *
   * @param name the logger name stamped onto every record it writes
   * @returns a logger bound to that name
   */
  private createLogger(name: UwtLoggerName): UwtLogger {
    return {
      log: (message, detail) => this.emit('log', name, message, detail),
      warn: (message, detail) => this.emit('warn', name, message, detail),
      error: (message, detail) => this.emit('error', name, message, detail)
    };
  }

  /** Severity floor for one logger — its own override, or the global one. */
  private minLevelFor(logger: UwtLoggerName): UwtLogLevel {
    const { levels, minLevel } = this.logsConfig;
    return levels?.[logger] ?? minLevel;
  }

  private emit(
    level: UwtLogLevel,
    logger: UwtLoggerName,
    message: string,
    detail?: UwtLogDetail
  ): void {
    uwtSafeVoid(`logger.${level}`, () => {
      if (
        UWT_LOG_LEVEL_ORDER[level] <
        UWT_LOG_LEVEL_ORDER[this.minLevelFor(logger)]
      ) {
        return;
      }

      const record = this.buildRecord(level, logger, message, detail);

      uwtDebugWrite('debugLogger', () => writeToConsole(record), record.logger);

      const sequence = this.deliver(record);

      if (level === 'error' && this.logsConfig.mirrorErrorsToRum && this.sink) {
        const mirrored =
          record.error ??
          uwtNormalizeError(new Error(record.message), this.redact);
        if (mirrored) {
          this.sink.recordError(mirrored);
          this.monitor.publish({
            kind: 'error',
            payload: mirrored,
            relatedSequence: sequence,
            destination: 'sink',
            origin: { forwarded: false }
          });
        }
      }
    });
  }

  /**
   * Guards against a throwing or secretly-async, rejecting provider, and
   * tells the monitor once the record has been handed over.
   *
   * @returns the monitor's sequence number for the record, when observed
   */
  private deliver(record: UwtLogRecord): number | undefined {
    let sequence: number | undefined;
    uwtSafeVoidMaybeAsync('logger.deliver', () => {
      const pending = this.apiProvider.send(record);
      // After send, so a provider that throws synchronously is not reported
      // as handed over. An asynchronous rejection can't be seen here.
      sequence = this.monitor.publish({
        kind: 'log',
        payload: record,
        destination: 'log-provider',
        origin: { forwarded: false }
      });
      return pending;
    });
    return sequence;
  }

  /** Gives the provider its chance to ship whatever it has queued itself. */
  private flushProvider(): void {
    uwtSafeVoidMaybeAsync('logger.providerFlush', () =>
      this.apiProvider.flush?.()
    );
  }

  private buildRecord(
    level: UwtLogLevel,
    logger: UwtLoggerName,
    message: string,
    detail?: UwtLogDetail
  ): UwtLogRecord {
    const redact = this.redact;
    const sink = this.sink;
    const identity = this.identity;

    return {
      timestamp: new Date().toISOString(),
      level,
      message: uwtScrubString(String(message ?? ''), redact),
      logger,
      context: detail?.context
        ? uwtScrubString(detail.context, redact)
        : undefined,
      metadata: uwtRedactMetadata(detail?.metadata, redact),
      error: uwtNormalizeError(detail?.error, redact),
      correlationId: detail?.correlationId
        ? uwtScrubString(detail.correlationId, redact)
        : undefined,
      application: identity.application,
      environment: identity.environment,
      version: identity.version,
      ...(sink && {
        userId: uwtSafe('getUserId', () => sink.getUserId(), undefined),
        sessionId: uwtSafe('getSessionId', () => sink.getSessionId(), undefined)
      })
    };
  }
}

/**
 * Prints the record exactly as the transport receives it.
 *
 * Prefixed with the application - in a composed
 * page every realm writes to the one console - then the logger name and
 * the context, each when present.
 */
function writeToConsole(record: UwtLogRecord): void {
  const scope = [record.logger, record.context]
    .filter(Boolean)
    .map((part) => `[${part}]`)
    .join('');
  const suffix = record.correlationId ? ` (${record.correlationId})` : '';

  console[record.level](
    `[${record.application}]${scope} ${record.message}${suffix}`,
    record
  );
}
