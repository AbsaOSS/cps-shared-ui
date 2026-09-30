import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal
} from '@angular/core';
import { CpsTelemetryMonitor, CpsTelemetryObservedEvent } from 'cps-telemetry';
import {
  CPS_TELEMETRY_DIAGNOSTICS_CONFIG,
  CpsDiagnosticsEntry,
  CpsDiagnosticsFieldFilter,
  CpsDiagnosticsFilterState,
  CpsDiagnosticsSectionId,
  CpsTelemetryDiagnosticsConfig
} from '../cps-diagnostics.models/cps-diagnostics.models';
import {
  cpsDiagnosticsSectionOf,
  cpsFlattenEvent,
  cpsKnownPaths,
  cpsMatchesFilters
} from '../cps-diagnostics-filter/cps-diagnostics-filter';
import { cpsSafeStringify } from '../cps-diagnostics-export/cps-diagnostics-export';

/** Library defaults, applied under whatever the application configures. */
export const CPS_DEFAULT_DIAGNOSTICS_CONFIG: Omit<
  CpsTelemetryDiagnosticsConfig,
  'shortcuts'
> = {
  enabled: true,
  maxEventsPerSection: 500,
  maxPayloadCharsInView: 256 * 1024
};

/** How often arriving events reach the screen, in milliseconds. */
export const CPS_DIAGNOSTICS_FLUSH_MS = 250;
/** How long a row counts as new, in milliseconds. */
const FRESH_MS = 3000;

export const CPS_DIAGNOSTICS_SECTIONS: readonly CpsDiagnosticsSectionId[] = [
  'bi',
  'scenario',
  'logging'
];

type PerSection<T> = Record<CpsDiagnosticsSectionId, T>;

function perSection<T>(make: () => T): PerSection<T> {
  return { bi: make(), scenario: make(), logging: make() };
}

/**
 * The popup's captured history. Provided by the popup itself, so it exists
 * exactly as long as the popup is open: created empty on open, subscribed
 * to {@link CpsTelemetryMonitor} for its lifetime, and discarded on close.
 *
 * Events arrive whenever the application sends them; they are batched and
 * reach the screen at most every {@link CPS_DIAGNOSTICS_FLUSH_MS}, so a
 * burst causes one re-render rather than hundreds. Each section keeps at
 * most `maxEventsPerSection`, newest first, and counts what it dropped.
 */
@Injectable()
export class CpsDiagnosticsStore {
  private readonly monitor = inject(CpsTelemetryMonitor);
  private readonly config: CpsTelemetryDiagnosticsConfig = {
    ...CPS_DEFAULT_DIAGNOSTICS_CONFIG,
    shortcuts: [],
    ...inject(CPS_TELEMETRY_DIAGNOSTICS_CONFIG, { optional: true })
  };

  /** Newest first. Written on every flush, paused or not. */
  private readonly buffers = perSection<CpsDiagnosticsEntry[]>(() => []);
  private readonly droppedCount = perSection(() => 0);
  private pending: CpsDiagnosticsEntry[] = [];
  private flushTimer?: ReturnType<typeof setTimeout>;
  private freshTimer?: ReturnType<typeof setTimeout>;

  /** When capturing began: the popup opening, or the last clear. */
  readonly startedAt = signal(new Date().toISOString());

  /** What the popup shows: the buffers as of the last unpaused flush. */
  readonly entries = signal<PerSection<readonly CpsDiagnosticsEntry[]>>(
    perSection(() => [])
  );

  readonly dropped = signal<PerSection<number>>(perSection(() => 0));

  /** Freezes what is shown. Capturing carries on underneath. */
  readonly paused = signal(false);
  /** Events captured while paused and not yet shown. */
  readonly newWhilePaused = signal(0);

  /**
   * Events received per section since opening or the last clear — keeps
   * rising after the retention cap, unlike the section lengths.
   */
  readonly received = signal<PerSection<number>>(perSection(() => 0));

  /** Sequence numbers from the latest flush, for a "new" marker. */
  readonly fresh = signal<ReadonlySet<number>>(new Set());

  /** Each section's own search text and field filters. */
  readonly filters = signal<PerSection<CpsDiagnosticsFilterState>>(
    perSection(emptyFilters)
  );

  /** Entries matching each section's own filters. */
  readonly filtered = computed<PerSection<readonly CpsDiagnosticsEntry[]>>(
    () => {
      const entries = this.entries();
      const filters = this.filters();
      return perSectionFrom((id) =>
        isFiltering(filters[id])
          ? entries[id].filter((e) => cpsMatchesFilters(e.fields, filters[id]))
          : entries[id]
      );
    }
  );

  /** Field paths seen so far in each section, for filter suggestions. */
  readonly knownPaths = computed<PerSection<string[]>>(() => {
    const entries = this.entries();
    return perSectionFrom((id) =>
      cpsKnownPaths(entries[id].map((e) => e.fields))
    );
  });

  readonly total = computed(() => {
    const entries = this.entries();
    return CPS_DIAGNOSTICS_SECTIONS.reduce(
      (n, id) => n + entries[id].length,
      0
    );
  });

  constructor() {
    const subscription = this.monitor.events$.subscribe((event) =>
      this.receive(event)
    );
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      clearTimeout(this.flushTimer);
      clearTimeout(this.freshTimer);
    });
  }

  /** Empties every section. Capturing continues. */
  clear(): void {
    for (const id of CPS_DIAGNOSTICS_SECTIONS) {
      this.buffers[id] = [];
      this.droppedCount[id] = 0;
    }
    this.pending = [];
    this.startedAt.set(new Date().toISOString());
    this.newWhilePaused.set(0);
    this.received.set(perSection(() => 0));
    this.publish();
  }

  setPaused(paused: boolean): void {
    this.paused.set(paused);
    if (!paused) {
      this.newWhilePaused.set(0);
      this.publish();
    }
  }

  setText(section: CpsDiagnosticsSectionId, text: string): void {
    this.updateFilters(section, (f) => ({ ...f, text }));
  }

  addFilter(
    section: CpsDiagnosticsSectionId,
    filter: Omit<CpsDiagnosticsFieldFilter, 'id'>
  ): void {
    this.updateFilters(section, (f) => ({
      ...f,
      fields: [...f.fields, { ...filter, id: newId() }]
    }));
  }

  removeFilter(section: CpsDiagnosticsSectionId, id: string): void {
    this.updateFilters(section, (f) => ({
      ...f,
      fields: f.fields.filter((x) => x.id !== id)
    }));
  }

  clearFilters(section: CpsDiagnosticsSectionId): void {
    this.updateFilters(section, emptyFilters);
  }

  /** Whether a section has any filter or search text active. */
  isFiltering(section: CpsDiagnosticsSectionId): boolean {
    return isFiltering(this.filters()[section]);
  }

  /**
   * Every event captured in one section: what is shown, plus anything held
   * back while paused or still waiting for the next flush. Oldest first.
   */
  sectionEvents(section: CpsDiagnosticsSectionId): CpsTelemetryObservedEvent[] {
    return [
      ...this.buffers[section].map((e) => e.event),
      ...this.pending.filter((e) => e.section === section).map((e) => e.event)
    ].sort((a, b) => a.sequence - b.sequence);
  }

  /** One section's totals for its export, counted like {@link sectionEvents}. */
  sectionCount(section: CpsDiagnosticsSectionId): {
    captured: number;
    droppedOldest: number;
  } {
    return {
      captured:
        this.buffers[section].length +
        this.pending.filter((e) => e.section === section).length,
      droppedOldest: this.droppedCount[section]
    };
  }

  private updateFilters(
    section: CpsDiagnosticsSectionId,
    change: (f: CpsDiagnosticsFilterState) => CpsDiagnosticsFilterState
  ): void {
    this.filters.update((all) => ({ ...all, [section]: change(all[section]) }));
  }

  /**
   * Called for every observed event. Never throws: an error here would
   * surface asynchronously in the application, since RxJS reports
   * subscriber errors on its own.
   */
  private receive(event: CpsTelemetryObservedEvent): void {
    try {
      this.pending.push(this.prepare(event));
      this.flushTimer ??= setTimeout(
        () => this.flush(),
        CPS_DIAGNOSTICS_FLUSH_MS
      );
    } catch {
      // Nothing to show for this one; later events are unaffected.
    }
  }

  private prepare(event: CpsTelemetryObservedEvent): CpsDiagnosticsEntry {
    const section = cpsDiagnosticsSectionOf(event.kind);
    try {
      return {
        event,
        section,
        fields: cpsFlattenEvent(event),
        sizeChars: cpsSafeStringify(event.payload).length
      };
    } catch (error) {
      return {
        event,
        section,
        fields: [],
        sizeChars: 0,
        renderError: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private flush(): void {
    this.flushTimer = undefined;
    const arrived = this.drain();
    if (arrived.length === 0) {
      return;
    }
    this.received.update((counts) => {
      const next = { ...counts };
      for (const entry of arrived) {
        next[entry.section]++;
      }
      return next;
    });
    if (this.paused()) {
      this.newWhilePaused.update((n) => n + arrived.length);
      return;
    }
    this.publish(arrived);
  }

  /** Moves pending events into the buffers. Returns what moved. */
  private drain(): CpsDiagnosticsEntry[] {
    const arrived = this.pending;
    this.pending = [];
    const max = Math.max(1, this.config.maxEventsPerSection);
    for (const entry of arrived) {
      const buffer = this.buffers[entry.section];
      buffer.unshift(entry);
      if (buffer.length > max) {
        this.droppedCount[entry.section] += buffer.length - max;
        buffer.length = max;
      }
    }
    return arrived;
  }

  private publish(arrived: readonly CpsDiagnosticsEntry[] = []): void {
    this.entries.set(perSectionFrom((id) => [...this.buffers[id]]));
    this.dropped.set({ ...this.droppedCount });
    this.fresh.set(new Set(arrived.map((e) => e.event.sequence)));
    clearTimeout(this.freshTimer);
    if (arrived.length) {
      this.freshTimer = setTimeout(() => this.fresh.set(new Set()), FRESH_MS);
    }
  }
}

function perSectionFrom<T>(
  make: (id: CpsDiagnosticsSectionId) => T
): PerSection<T> {
  return {
    bi: make('bi'),
    scenario: make('scenario'),
    logging: make('logging')
  };
}

function emptyFilters(): CpsDiagnosticsFilterState {
  return { text: '', fields: [] };
}

function isFiltering(filters: CpsDiagnosticsFilterState): boolean {
  return !!filters.text.trim() || filters.fields.length > 0;
}

let idCounter = 0;
function newId(): string {
  return `f${++idCounter}`;
}
