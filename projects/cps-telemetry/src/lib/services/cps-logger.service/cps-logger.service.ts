import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CPS_LOG_CONFIG } from '../../config/cps-log.config/cps-log.config';
import {
  CPS_LOG_LEVEL_ORDER,
  CpsLoggerName,
  CpsLogDetail,
  CpsLogLevel,
  CpsLogRecord
} from '../../models/cps-log.models/cps-log.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import { cpsIsDebugEnabled } from '../../utils/cps-debug-flag.util/cps-debug-flag.util';
import {
  cpsNormalizeError,
  cpsRedactConfigFor,
  cpsRedactMetadata,
  cpsScrubString
} from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import {
  cpsIsBrowser,
  cpsSafe,
  cpsSafeVoid,
  cpsSafeVoidMaybeAsync
} from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';

/**
 * Detail pre-bound onto a child logger by {@link CpsLogger.child}.
 *
 * @group Types
 */
export type CpsLogBindings = Pick<
  CpsLogDetail,
  'logger' | 'context' | 'correlationId' | 'metadata'
>;

/**
 * The application-facing logging API.
 *
 * @group Interfaces
 */
export interface CpsLogger {
  log(message: string, detail?: CpsLogDetail): void;
  warn(message: string, detail?: CpsLogDetail): void;
  error(message: string, detail?: CpsLogDetail): void;

  /**
   * Returns a logger that pre-applies the given detail to every call.
   *
   * @param bindings detail merged into every record from the child
   */
  child(bindings: CpsLogBindings): CpsLogger;
}

/**
 * Structured application logging.
 *
 * Log records go to the application's {@link CpsLogApiProvider}, **not** to
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
 * @example
 * ```typescript
 * private logger = inject(CpsLoggerService);
 *
 * this.logger.error('Failed to load customer data', {
 *   error,
 *   correlationId: scenario.id
 * });
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsLoggerService implements CpsLogger, OnDestroy {
  private readonly identity = inject(CPS_TELEMETRY_IDENTITY);
  private readonly logsConfig = inject(CPS_LOG_CONFIG);
  private readonly redact = cpsRedactConfigFor(
    inject(CPS_REDACT_CONFIG),
    this.logsConfig.redact
  );

  /** Enrichment only (`sessionId`/`userId`, optional RUM mirroring) — see DESIGN.md §10. */
  private readonly sink = inject(CpsTelemetrySink, { optional: true });
  private readonly apiProvider = inject(CPS_LOG_API_PROVIDER);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = cpsIsBrowser();

  private readonly onPageHide = () => this.flushProvider();
  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'hidden') {
      this.flushProvider();
    }
  };

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
   * Records an informational message.
   *
   * @param message the message; URL query strings are stripped from it
   * @param detail optional context, metadata, error and correlation id
   */
  log(message: string, detail?: CpsLogDetail): void {
    this.emit('log', message, detail);
  }

  /**
   * Records a warning.
   *
   * @param message the message
   * @param detail optional context, metadata, error and correlation id
   */
  warn(message: string, detail?: CpsLogDetail): void {
    this.emit('warn', message, detail);
  }

  /**
   * Records an error.
   *
   * @param message the message
   * @param detail optional context, metadata, error and correlation id
   */
  error(message: string, detail?: CpsLogDetail): void {
    this.emit('error', message, detail);
  }

  /**
   * Returns a logger that stamps the given detail onto every record.
   *
   * @param bindings detail merged into every record from the child
   * @returns a bound logger
   */
  child(bindings: CpsLogBindings): CpsLogger {
    return {
      log: (message, detail) => this.log(message, merge(bindings, detail)),
      warn: (message, detail) => this.warn(message, merge(bindings, detail)),
      error: (message, detail) => this.error(message, merge(bindings, detail)),
      child: (nested) => this.child(merge(bindings, nested) as CpsLogBindings)
    };
  }

  /**
   * Reads records back from the application's log backend. Useful for
   * pulling one journey together — every line written during a scenario
   * shares its id as the correlation id:
   *
   * @example
   * ```typescript
   * const lines = await this.logger.query({ correlationId: scenario.id });
   * ```
   *
   * Fail-open: a provider that throws or rejects resolves to `[]`.
   *
   * @param filter narrows what is returned
   * @returns the matching records, or `[]` when none can be read
   */
  async query(filter: CpsLogQuery = {}): Promise<CpsLogRecord[]> {
    const pending = cpsSafe(
      'logger.query',
      () => this.apiProvider.query(filter),
      undefined
    );

    return (await pending?.catch(() => undefined)) ?? [];
  }

  /**
   * Returns the named logger for one part of the application. The name
   * lands on every record as `logger`, and is what
   * {@link CpsLogConfig.levels} and the `debugLogger` flag target. Declare
   * the name in {@link CpsLoggerNames} first, and bind it once as a field:
   *
   * @example
   * ```typescript
   * class CheckoutService {
   *   private readonly logger = inject(CpsLoggerService).getLogger('checkout');
   *
   *   submit() {
   *     this.logger.log('Submitting order');
   *   }
   * }
   * ```
   *
   * @param name the logger name, declared in {@link CpsLoggerNames}
   * @param bindings further detail stamped onto every record from this logger
   * @returns a logger bound to that name
   */
  getLogger(
    name: CpsLoggerName,
    bindings?: Omit<CpsLogBindings, 'logger'>
  ): CpsLogger {
    return this.child({ ...bindings, logger: name });
  }

  /** Severity floor for one logger — its own override, or the global one. */
  private minLevelFor(logger?: CpsLoggerName): CpsLogLevel {
    const { levels, minLevel } = this.logsConfig;
    return (logger ? levels?.[logger] : undefined) ?? minLevel;
  }

  private emit(
    level: CpsLogLevel,
    message: string,
    detail?: CpsLogDetail
  ): void {
    cpsSafeVoid(`logger.${level}`, () => {
      if (
        CPS_LOG_LEVEL_ORDER[level] <
        CPS_LOG_LEVEL_ORDER[this.minLevelFor(detail?.logger)]
      ) {
        return;
      }

      const record = this.buildRecord(level, message, detail);

      if (cpsIsDebugEnabled('debugLogger', record.logger)) {
        writeToConsole(record);
      }

      this.deliver(record);

      if (level === 'error' && this.logsConfig.mirrorErrorsToRum && this.sink) {
        const mirrored =
          record.error ??
          cpsNormalizeError(new Error(record.message), this.redact);
        if (mirrored) {
          this.sink.recordError(mirrored);
        }
      }
    });
  }

  /** Guards against a throwing or secretly-async, rejecting provider. */
  private deliver(record: CpsLogRecord): void {
    cpsSafeVoidMaybeAsync('logger.deliver', () =>
      this.apiProvider.send(record)
    );
  }

  /** Gives the provider its chance to ship whatever it has queued itself. */
  private flushProvider(): void {
    cpsSafeVoidMaybeAsync('logger.providerFlush', () =>
      this.apiProvider.flush?.()
    );
  }

  private buildRecord(
    level: CpsLogLevel,
    message: string,
    detail?: CpsLogDetail
  ): CpsLogRecord {
    const redact = this.redact;
    const sink = this.sink;
    const identity = this.identity;

    return {
      timestamp: new Date().toISOString(),
      level,
      message: cpsScrubString(String(message ?? ''), redact),
      logger: detail?.logger,
      context: detail?.context
        ? cpsScrubString(detail.context, redact)
        : undefined,
      metadata: cpsRedactMetadata(detail?.metadata, redact),
      error: cpsNormalizeError(detail?.error, redact),
      correlationId: detail?.correlationId
        ? cpsScrubString(detail.correlationId, redact)
        : undefined,
      application: identity.application,
      environment: identity.environment,
      version: identity.version,
      ...(sink && {
        userId: cpsSafe('getUserId', () => sink.getUserId(), undefined),
        sessionId: cpsSafe('getSessionId', () => sink.getSessionId(), undefined)
      })
    };
  }
}

function merge(bindings: CpsLogBindings, detail?: CpsLogDetail): CpsLogDetail {
  return {
    ...detail,
    logger: detail?.logger ?? bindings.logger,
    context: detail?.context ?? bindings.context,
    correlationId: detail?.correlationId ?? bindings.correlationId,
    metadata:
      bindings.metadata || detail?.metadata
        ? { ...bindings.metadata, ...detail?.metadata }
        : undefined
  };
}

/**
 * Prints the record exactly as the transport receives it.
 *
 * Prefixed with the application - in a composed
 * page every realm writes to the one console.
 */
function writeToConsole(record: CpsLogRecord): void {
  const prefix = record.context
    ? `[${record.application}][${record.context}]`
    : `[${record.application}]`;
  const suffix = record.correlationId ? ` (${record.correlationId})` : '';

  // eslint-disable-next-line no-console
  console[record.level](`${prefix} ${record.message}${suffix}`, record);
}
