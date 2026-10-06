import { inject, Injectable } from '@angular/core';
import {
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UWT_BI_TELEMETRY_CONFIG } from '../../config/uwt-bi-telemetry.config/uwt-bi-telemetry.config';
import type {
  UwtBIEvent,
  UwtBIEventDetail,
  UwtBIEventName
} from '../../models/uwt-bi.models/uwt-bi.models';
import {
  uwtEventTypes,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UwtTelemetryMonitor } from '../uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import { uwtDebugWrite } from '../../utils/uwt-debug-flag.util/uwt-debug-flag.util';
import {
  uwtRedactConfigFor,
  uwtRedactMetadata,
  uwtScrubString
} from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
import {
  uwtNow,
  uwtSafeVoid
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';

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
 *   private biTelemetry = inject(UwtBITelemetryService);
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
export class UwtBITelemetryService {
  private readonly identity = inject(UWT_TELEMETRY_IDENTITY);
  private readonly biConfig = inject(UWT_BI_TELEMETRY_CONFIG);
  private readonly redact = uwtRedactConfigFor(
    inject(UWT_REDACT_CONFIG),
    this.biConfig.redact
  );

  private readonly sink = inject(UwtTelemetrySink);
  private readonly monitor = inject(UwtTelemetryMonitor);
  private readonly eventTypes = uwtEventTypes(this.identity.eventNamespace);
  private readonly lastEmittedAt = new Map<string, number>();

  /**
   * Records a business or UX event.
   *
   * @param eventName the application's own event name, e.g. `export_clicked`,
   *   as declared in {@link UwtBIEventNames}. Treat it as a metric dimension:
   *   keep the cardinality low and never interpolate an identifier into it.
   * @param metadata flat attributes describing the interaction
   * @param detail optional scenario correlation, feature and event-type override
   */
  track(
    eventName: UwtBIEventName,
    metadata?: UwtTelemetryMetadata,
    detail?: UwtBIEventDetail
  ): void {
    uwtSafeVoid('biTelemetry.track', () => {
      if (!eventName) {
        return;
      }

      const redactedFeature = detail?.feature
        ? uwtScrubString(detail.feature, this.redact)
        : undefined;
      const redactedMetadata = uwtRedactMetadata(metadata, this.redact);

      if (
        this.isDuplicate(eventName, redactedMetadata, {
          ...detail,
          feature: redactedFeature
        })
      ) {
        return;
      }

      const event: UwtBIEvent = {
        eventName,
        eventTime: new Date().toISOString(),
        scenarioId: detail?.scenarioId,
        feature: redactedFeature,
        metadata: redactedMetadata,
        application: this.identity.application
      };

      const eventType = detail?.eventType || this.eventTypes.bi;

      uwtDebugWrite('debugBI', () =>
        writeToConsole(eventName, eventType, event)
      );

      this.sink.record(eventType, event);
      this.monitor.publish({
        kind: 'bi',
        eventType,
        payload: event,
        destination: 'sink',
        origin: { forwarded: false }
      });
    });
  }

  private isDuplicate(
    eventName: string,
    metadata: UwtTelemetryMetadata | undefined,
    detail?: UwtBIEventDetail
  ): boolean {
    const key = JSON.stringify([
      eventName,
      detail?.scenarioId ?? '',
      detail?.eventType ?? '',
      detail?.feature ?? '',
      this.metadataKey(metadata)
    ]);
    const now = uwtNow();
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
  private metadataKey(metadata: UwtTelemetryMetadata | undefined): string {
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

/**
 * Prefixed with the application - in a composed
 * page every realm writes to the one console.
 */
function writeToConsole(
  eventName: string,
  eventType: string,
  event: UwtBIEvent
): void {
  console.log(`[${event.application}][bi] ${eventName} -> ${eventType}`, event);
}
