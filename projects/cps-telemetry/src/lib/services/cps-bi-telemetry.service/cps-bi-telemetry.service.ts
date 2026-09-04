import { inject, Injectable } from '@angular/core';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CPS_BI_CONFIG } from '../../config/cps-bi.config/cps-bi.config';
import {
  CpsBiEvent,
  CpsBiEventDetail
} from '../../models/cps-bi.models/cps-bi.models';
import {
  cpsEventTypes,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { cpsIsDebugEnabled } from '../../utils/cps-debug-flag.util/cps-debug-flag.util';
import {
  cpsRedactConfigFor,
  cpsRedactMetadata,
  cpsScrubString
} from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import {
  cpsNow,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';

/**
 * Business and UX event tracking — feature adoption, interaction analysis,
 * funnel steps.
 *
 * Unlike scenarios, BI events are discrete: no duration, no lifecycle. Event
 * names and attributes come entirely from the application.
 *
 * Repeated identical events within a short window are collapsed, absorbing
 * double-fires from a `click` handler also bound to `keydown`, or from a
 * user clicking twice.
 *
 * Console output is off unless the `debugBI` LocalStorage flag is set:
 *
 * ```js
 * localStorage.setItem('debugBI', 'true');
 * ```
 *
 * @example
 * ```typescript
 * class CustomerTableComponent {
 *   private biTelemetry = inject(CpsBiTelemetryService);
 *
 *   onExport(format: string) {
 *     this.biTelemetry.track('export_clicked', {
 *       exportType: format,
 *       source: 'customer-table'
 *     });
 *   }
 * }
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsBiTelemetryService {
  private readonly identity = inject(CPS_TELEMETRY_IDENTITY);
  private readonly biConfig = inject(CPS_BI_CONFIG);
  private readonly redact = cpsRedactConfigFor(
    inject(CPS_REDACT_CONFIG),
    this.biConfig.redact
  );

  private readonly sink = inject(CpsTelemetrySink);
  private readonly eventTypes = cpsEventTypes(this.identity.eventNamespace);
  private readonly lastEmittedAt = new Map<string, number>();

  /**
   * Records a business or UX event.
   *
   * @param eventName the application's own event name, e.g. `export_clicked`.
   *   Treat it as a metric dimension: keep the cardinality low and never
   *   interpolate an identifier into it.
   * @param metadata flat attributes describing the interaction
   * @param detail optional scenario correlation, feature and event-type override
   */
  track(
    eventName: string,
    metadata?: CpsTelemetryMetadata,
    detail?: CpsBiEventDetail
  ): void {
    cpsSafeVoid('biTelemetry.track', () => {
      if (!eventName) {
        return;
      }

      const redactedFeature = detail?.feature
        ? cpsScrubString(detail.feature, this.redact)
        : undefined;
      const redactedMetadata = cpsRedactMetadata(metadata, this.redact);

      if (
        this.isDuplicate(eventName, redactedMetadata, {
          ...detail,
          feature: redactedFeature
        })
      ) {
        return;
      }

      const event: CpsBiEvent = {
        eventName,
        eventTime: new Date().toISOString(),
        scenarioId: detail?.scenarioId,
        feature: redactedFeature,
        metadata: redactedMetadata,
        application: this.identity.application
      };

      const eventType = detail?.eventType || this.eventTypes.bi;

      if (cpsIsDebugEnabled('debugBI')) {
        writeToConsole(eventName, eventType, event);
      }

      this.sink.record(eventType, event as unknown as object);
    });
  }

  private isDuplicate(
    eventName: string,
    metadata: CpsTelemetryMetadata | undefined,
    detail?: CpsBiEventDetail
  ): boolean {
    const key = JSON.stringify([
      eventName,
      detail?.scenarioId ?? '',
      detail?.eventType ?? '',
      detail?.feature ?? '',
      this.metadataKey(metadata)
    ]);
    const now = cpsNow();
    const last = this.lastEmittedAt.get(key);

    if (last !== undefined && now - last < this.biConfig.dedupWindowMs) {
      this.lastEmittedAt.delete(key);
      this.lastEmittedAt.set(key, last);
      return true;
    }

    if (this.lastEmittedAt.size >= this.biConfig.dedupMaxKeys) {
      for (const [staleKey, at] of this.lastEmittedAt) {
        if (now - at >= this.biConfig.dedupWindowMs) {
          this.lastEmittedAt.delete(staleKey);
        }
      }

      if (this.lastEmittedAt.size >= this.biConfig.dedupMaxKeys) {
        const oldestKey = this.lastEmittedAt.keys().next().value;
        if (oldestKey !== undefined) {
          this.lastEmittedAt.delete(oldestKey);
        }
      }
    }

    this.lastEmittedAt.delete(key);
    this.lastEmittedAt.set(key, now);
    return false;
  }

  /**
   * A stable string encoding a flat metadata object's content, for use in
   * the dedup key — otherwise two same-named events with different metadata
   * would collide and the second would be silently dropped. Keys are sorted
   * so property order doesn't affect the result. Callers pass already-
   * redacted metadata — a caller's raw values must never end up as a `Map`
   * key living in this root service's memory for the page lifetime.
   */
  private metadataKey(metadata: CpsTelemetryMetadata | undefined): string {
    if (!metadata) {
      return '';
    }
    return JSON.stringify(
      Object.keys(metadata)
        .sort()
        .map((k) => [k, metadata[k]])
    );
  }
}

function writeToConsole(
  eventName: string,
  eventType: string,
  event: CpsBiEvent
): void {
  // eslint-disable-next-line no-console
  console.log(`[cps][bi] ${eventName} -> ${eventType}`, event);
}
