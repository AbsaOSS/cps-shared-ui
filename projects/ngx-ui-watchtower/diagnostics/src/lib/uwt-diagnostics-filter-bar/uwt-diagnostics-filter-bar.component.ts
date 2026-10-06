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
  UwtDiagnosticsFilterOperator,
  UwtDiagnosticsSectionId
} from '../uwt-diagnostics.models/uwt-diagnostics.models';
import { UwtDiagnosticsStore } from '../uwt-diagnostics-store/uwt-diagnostics-store';
import {
  uwtDescribeFilter,
  uwtOperatorNeedsValue
} from '../uwt-diagnostics-filter/uwt-diagnostics-filter';

/** Typing settles for this long before filtering runs, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * One section's free-text search, field-filter builder and active filters.
 * Each section filters on its own; nothing here affects the others.
 */
@Component({
  selector: 'uwt-diagnostics-filter-bar',
  imports: [
    CpsInputComponent,
    CpsAutocompleteComponent,
    CpsSelectComponent,
    CpsButtonComponent,
    CpsChipComponent,
    CpsInfoCircleComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uwt-diagnostics-filter-bar.component.html',
  styleUrl: './uwt-diagnostics-filter-bar.component.scss'
})
export class UwtDiagnosticsFilterBarComponent {
  protected readonly store = inject(UwtDiagnosticsStore);

  /** The section these filters belong to. */
  readonly section = input.required<UwtDiagnosticsSectionId>();
  /** The section's name as people read it, e.g. `BI telemetry`. */
  readonly sectionName = input.required<string>();

  protected readonly filters = computed(
    () => this.store.filters()[this.section()]
  );

  protected readonly operators: {
    label: string;
    value: UwtDiagnosticsFilterOperator;
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
    signal<UwtDiagnosticsFilterOperator>('contains');

  protected readonly value = signal('');

  protected readonly pathOptions = computed(() =>
    this.store.knownPaths()[this.section()].map((p) => ({ label: p, value: p }))
  );

  protected readonly needsValue = computed(() =>
    uwtOperatorNeedsValue(this.operator())
  );

  protected readonly canAdd = computed(
    () => !!this.path().trim() && (!this.needsValue() || !!this.value().trim())
  );

  protected readonly chips = computed(() =>
    this.filters().fields.map((f) => ({
      id: f.id,
      text: uwtDescribeFilter(f)
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
