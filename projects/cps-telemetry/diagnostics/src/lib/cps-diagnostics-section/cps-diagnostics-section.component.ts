import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import {
  CpsChipComponent,
  CpsButtonComponent,
  CpsExpansionPanelComponent,
  CpsIconType,
  CpsTableComponent
} from 'cps-ui-kit';
import { CpsDiagnosticsSectionId } from '../cps-diagnostics.models/cps-diagnostics.models';
import { CpsDiagnosticsStore } from '../cps-diagnostics-store/cps-diagnostics-store';
import { CpsDiagnosticsJsonComponent } from '../cps-diagnostics-json/cps-diagnostics-json.component';
import { CpsDiagnosticsFilterBarComponent } from '../cps-diagnostics-filter-bar/cps-diagnostics-filter-bar.component';
import { CpsDiagnosticsExporter } from '../cps-diagnostics-export/cps-diagnostics-exporter';
import {
  CPS_DIAGNOSTICS_COLUMNS,
  cpsDiagnosticsRow,
  cpsDiagnosticsTime
} from './cps-diagnostics-columns';

const SECTION_TEXT: Record<
  CpsDiagnosticsSectionId,
  { title: string; icon: CpsIconType; empty: string }
> = {
  bi: {
    title: 'BI telemetry',
    icon: 'graph',
    empty: 'No BI events since this window opened.'
  },
  scenario: {
    title: 'Scenario telemetry',
    icon: 'measurement',
    empty: 'No scenario events since this window opened.'
  },
  logging: {
    title: 'Logging',
    icon: 'book',
    empty: 'No log records since this window opened.'
  }
};

/**
 * One section of the popup: an expander holding the section's own filters,
 * its download and copy actions, and a paginated table of its events.
 */
@Component({
  selector: 'cps-diagnostics-section',
  imports: [
    CpsExpansionPanelComponent,
    CpsTableComponent,
    CpsChipComponent,
    CpsButtonComponent,
    CpsDiagnosticsJsonComponent,
    CpsDiagnosticsFilterBarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cps-diagnostics-section.component.html',
  styleUrl: './cps-diagnostics-section.component.scss'
})
export class CpsDiagnosticsSectionComponent {
  protected readonly store = inject(CpsDiagnosticsStore);
  private readonly exporter = inject(CpsDiagnosticsExporter);

  readonly section = input.required<CpsDiagnosticsSectionId>();
  /** Serialized size above which a payload is shown truncated. */
  readonly maxPayloadChars = input(256 * 1024);

  protected readonly first = signal(0);
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  protected readonly text = computed(() => SECTION_TEXT[this.section()]);
  protected readonly columns = computed(
    () => CPS_DIAGNOSTICS_COLUMNS[this.section()]
  );

  protected readonly rows = computed(() => {
    const columns = this.columns();
    return this.store
      .filtered()
      [this.section()].map((entry) => cpsDiagnosticsRow(entry, columns));
  });

  private readonly captured = computed(
    () => this.store.entries()[this.section()]
  );

  /** The expander title — the kit's header takes plain text only. */
  protected readonly title = computed(() => {
    const { title } = this.text();
    const captured = this.captured();
    if (captured.length === 0) {
      return `${title} · no events yet`;
    }
    const count = this.store.isFiltering(this.section())
      ? `${this.rows().length} of ${captured.length}`
      : `${captured.length}`;
    const last = cpsDiagnosticsTime(captured[0].event.capturedAt).slice(0, 8);
    const dropped = this.store.dropped()[this.section()];
    return [
      title,
      count,
      `last ${last}`,
      dropped ? `oldest ${dropped} dropped` : ''
    ]
      .filter(Boolean)
      .join(' · ');
  });

  protected readonly emptyMessage = computed(() =>
    this.captured().length > 0
      ? 'No events match the filters.'
      : this.text().empty
  );

  /** Fresh arrivals that a reader past page one cannot see. */
  protected readonly unseenNew = computed(() =>
    this.first() > 0
      ? this.rows().filter((r) => this.store.fresh().has(r.sequence)).length
      : 0
  );

  protected onPage(state: { first?: number }): void {
    this.first.set(state?.first ?? 0);
  }

  protected goToNewest(): void {
    this.first.set(0);
  }

  protected download(): void {
    this.exporter.download(this.section());
  }

  protected async copy(): Promise<void> {
    this.copyState.set(
      (await this.exporter.copy(this.section())) ? 'copied' : 'failed'
    );
    setTimeout(() => this.copyState.set('idle'), 2000);
  }

  protected isFresh(sequence: number): boolean {
    return this.store.fresh().has(sequence);
  }
}
