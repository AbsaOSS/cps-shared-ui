import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal
} from '@angular/core';
import {
  CpsAutocompleteComponent,
  CpsButtonComponent,
  CpsChipComponent,
  CpsInfoCircleComponent,
  CpsInputComponent,
  CpsSelectComponent
} from 'cps-ui-kit';
import {
  CpsDiagnosticsFilterOperator,
  CpsDiagnosticsSectionId
} from '../cps-diagnostics.models/cps-diagnostics.models';
import { CpsDiagnosticsStore } from '../cps-diagnostics-store/cps-diagnostics-store';
import {
  cpsDescribeFilter,
  cpsOperatorNeedsValue
} from '../cps-diagnostics-filter/cps-diagnostics-filter';

/** Typing settles for this long before filtering runs, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * One section's free-text search, field-filter builder and active filters.
 * Each section filters on its own; nothing here affects the others.
 */
@Component({
  selector: 'cps-diagnostics-filter-bar',
  imports: [
    CpsInputComponent,
    CpsAutocompleteComponent,
    CpsSelectComponent,
    CpsButtonComponent,
    CpsChipComponent,
    CpsInfoCircleComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cps-diagnostics-filter-bar.component.html',
  styleUrl: './cps-diagnostics-filter-bar.component.scss'
})
export class CpsDiagnosticsFilterBarComponent {
  protected readonly store = inject(CpsDiagnosticsStore);

  /** The section these filters belong to. */
  readonly section = input.required<CpsDiagnosticsSectionId>();
  /** The section's name as people read it, e.g. `BI telemetry`. */
  readonly sectionName = input.required<string>();

  protected readonly filters = computed(
    () => this.store.filters()[this.section()]
  );

  protected readonly operators: {
    label: string;
    value: CpsDiagnosticsFilterOperator;
  }[] = [
    { label: 'contains', value: 'contains' },
    { label: 'equals', value: 'equals' },
    { label: 'does not contain', value: 'not-contains' },
    { label: 'exists', value: 'exists' },
    { label: 'is missing', value: 'missing' }
  ];

  protected readonly builderOpen = signal(false);
  protected readonly path = signal('');
  protected readonly operator =
    signal<CpsDiagnosticsFilterOperator>('contains');

  protected readonly value = signal('');

  protected readonly pathOptions = computed(() =>
    this.store.knownPaths()[this.section()].map((p) => ({ label: p, value: p }))
  );

  protected readonly needsValue = computed(() =>
    cpsOperatorNeedsValue(this.operator())
  );

  protected readonly canAdd = computed(
    () => !!this.path().trim() && (!this.needsValue() || !!this.value().trim())
  );

  protected readonly chips = computed(() =>
    this.filters().fields.map((f) => ({
      id: f.id,
      text: cpsDescribeFilter(f)
    }))
  );

  protected readonly anyActive = computed(() => {
    const f = this.filters();
    return !!f.text.trim() || f.fields.length > 0;
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  protected onSearch(text: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(
      () => this.store.setText(this.section(), text ?? ''),
      SEARCH_DEBOUNCE_MS
    );
  }

  protected onPath(value: unknown): void {
    this.path.set(typeof value === 'string' ? value : '');
  }

  protected onOperator(value: unknown): void {
    const match = this.operators.find((o) => o.value === value);
    this.operator.set(match?.value ?? 'contains');
  }

  protected add(): void {
    if (!this.canAdd()) {
      return;
    }
    this.store.addFilter(this.section(), {
      path: this.path().trim(),
      operator: this.operator(),
      value: this.needsValue() ? this.value().trim() : ''
    });
    this.value.set('');
  }

  protected clearAll(): void {
    clearTimeout(this.searchTimer);
    this.store.clearFilters(this.section());
  }
}
