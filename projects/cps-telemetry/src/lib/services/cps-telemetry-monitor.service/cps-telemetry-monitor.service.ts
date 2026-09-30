import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  CpsTelemetryObservedEvent,
  CpsTelemetryPublishInput
} from '../../models/cps-telemetry-monitor.models/cps-telemetry-monitor.models';
import {
  cpsDeepClone,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';

/**
 * A read-only view of every event this library hands to a destination —
 * the telemetry sink or the application's log API provider.
 *
 * Each hand-off site publishes here immediately *after* the hand-off, with
 * the very object it just sent. Nothing is sent from here: this is an
 * in-memory stream for observers such as the diagnostics popup, never a
 * second delivery path, so observing it cannot cause an event to be sent
 * twice.
 *
 * Costs one check per event while nobody subscribes. A subscriber receives
 * a deep copy of each payload, so it can neither change what was sent nor
 * see a live object change after the fact.
 *
 * "Handed over" is not "delivered": a sink may still drop an event, for
 * example when RUM samples a session out or reaches its event limit.
 *
 * @example
 * ```typescript
 * inject(CpsTelemetryMonitor)
 *   .events$.pipe(filter((e) => e.kind === 'scenario'))
 *   .subscribe((e) => console.table(e.payload));
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsTelemetryMonitor implements OnDestroy {
  private readonly subject = new Subject<CpsTelemetryObservedEvent>();
  private sequence = 0;

  /** Every observed event, from the moment of subscription onward. */
  readonly events$: Observable<CpsTelemetryObservedEvent> =
    this.subject.asObservable();

  /** Whether anything is currently subscribed to {@link events$}. */
  get observed(): boolean {
    return this.subject.observed;
  }

  /**
   * Records one hand-off. Called by the library's own hand-off sites; an
   * application has no reason to call it.
   *
   * @param input the event just handed over, and where it went
   * @returns the sequence number assigned, or `undefined` when nobody is
   *   subscribed and the event was not recorded
   */
  publish(input: CpsTelemetryPublishInput): number | undefined {
    if (!this.subject.observed) {
      return undefined;
    }

    const sequence = ++this.sequence;
    cpsSafeVoid('monitor.publish', () => {
      this.subject.next({
        ...input,
        payload: cpsDeepClone(input.payload),
        sequence,
        capturedAt: new Date().toISOString()
      } as CpsTelemetryObservedEvent);
    });
    return sequence;
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    this.subject.complete();
  }
}
