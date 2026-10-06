import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal
} from '@angular/core';
import {
  CpsChipComponent,
  CpsButtonComponent,
  CpsExpansionPanelComponent,
  CpsIconType,
  CpsTableComponent
} from 'cps-ui-kit';
import { UwtDiagnosticsSectionId } from '../uwt-diagnostics.models/uwt-diagnostics.models';
import {
  UWT_DEFAULT_DIAGNOSTICS_CONFIG,
  UwtDiagnosticsStore
} from '../uwt-diagnostics-store/uwt-diagnostics-store';
import { UwtDiagnosticsJsonComponent } from '../uwt-diagnostics-json/uwt-diagnostics-json.component';
import { UwtDiagnosticsFilterBarComponent } from '../uwt-diagnostics-filter-bar/uwt-diagnostics-filter-bar.component';
import { UwtDiagnosticsExporter } from '../uwt-diagnostics-export/uwt-diagnostics-exporter';
import {
  UWT_DIAGNOSTICS_COLUMNS,
  uwtDiagnosticsRow,
  uwtDiagnosticsTime
} from './uwt-diagnostics-columns';

const SECTION_TEXT: Record<
  UwtDiagnosticsSectionId,
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
  selector: 'uwt-diagnostics-section',
  imports: [
    CpsExpansionPanelComponent,
    CpsTableComponent,
    CpsChipComponent,
    CpsButtonComponent,
    UwtDiagnosticsJsonComponent,
    UwtDiagnosticsFilterBarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uwt-diagnostics-section.component.html',
  styleUrl: './uwt-diagnostics-section.component.scss'
})
export class UwtDiagnosticsSectionComponent {
  protected readonly store = inject(UwtDiagnosticsStore);
  private readonly exporter = inject(UwtDiagnosticsExporter);

  readonly section = input.required<UwtDiagnosticsSectionId>();
  /** JSON length, in characters, above which a payload is shown truncated. */
  readonly maxPayloadChars = input(
    UWT_DEFAULT_DIAGNOSTICS_CONFIG.maxPayloadCharsInView
  );

  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  protected readonly text = computed(() => SECTION_TEXT[this.section()]);
  protected readonly columns = computed(
    () => UWT_DIAGNOSTICS_COLUMNS[this.section()]
  );

  protected readonly rows = computed(() => {
    const columns = this.columns();
    return this.store
      .filtered()
      [this.section()].map((entry) => uwtDiagnosticsRow(entry, columns));
  });

  /**
   * The paginator's offset. Kept while it still lands on a row; otherwise —
   * a filter or a clear shrinking the rows past it — back to the first page,
   * where the newest events are. The table won't do this itself: PrimeNG
   * steps back one page at most, so page four filtered down to one page
   * would show an empty table.
   */
  protected readonly first = linkedSignal<readonly unknown[], number>({
    source: this.rows,
    computation: (rows, previous) =>
      previous && previous.value < rows.length ? previous.value : 0
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
    const last = uwtDiagnosticsTime(captured[0].event.capturedAt).slice(0, 8);
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
