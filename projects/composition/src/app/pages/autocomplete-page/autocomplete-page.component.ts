import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CpsAutocompleteComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponentData from '../../api-data/cps-autocomplete.json';
import { autocompleteExamples } from './autocomplete-page.examples';
import { Observable, Subject, Subscription, of, delay } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import {
  CpsLoggerService,
  CpsScenario,
  CpsScenarioTelemetryService,
  traceScenario
} from 'cps-telemetry';
import '../../services/telemetry.schema';

@Component({
  imports: [
    CpsAutocompleteComponent,
    FormsModule,
    ReactiveFormsModule,
    ComponentDocsViewerComponent,
    CodeExampleComponent,
    CommonModule
  ],
  selector: 'app-autocomplete-page',
  templateUrl: './autocomplete-page.component.html',
  styleUrls: ['./autocomplete-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'composition-page' }
})
export class AutocompletePageComponent implements OnInit, OnDestroy {
  options = [
    { name: 'New York', data: { code: 'NY' }, alias: 'NYC' },
    {
      name: 'Prague',
      data: { code: 'PRG' },
      info: 'Prague info',
      alias: 'PRG'
    },
    {
      name: 'Capetown',
      data: { code: 'CPT' },
      info: 'Capetown info',
      alias: 'CPT'
    },
    { name: 'Rome', data: { code: 'RM' }, alias: 'ROM' },
    {
      name: 'London',
      data: { code: 'LDN' },
      info: 'London info',
      alias: 'LDN'
    },
    { name: 'Istanbul', data: { code: 'IST' }, alias: 'IST' },
    { name: 'Paris', data: { code: 'PRS' }, alias: 'PAR' },
    { name: 'Tokyo', data: { code: 'TOK' }, alias: 'TOK' },
    { name: 'Oslo', data: { code: 'OSL' }, info: 'Oslo info', alias: 'OSL' },
    { name: 'Berlin', data: { code: 'BER' }, alias: 'BER' }
  ];

  syncOptions = [
    { title: 'Amazon', val: 'AMZN', ticker: 'AMZN' },
    { title: 'Apple', val: 'AAPL', ticker: 'AAPL' },
    { title: 'Google', val: 'GOOGL', ticker: 'GOOGL' },
    { title: 'Meta', val: 'META', ticker: 'META' },
    { title: 'Microsoft', val: 'MSFT', ticker: 'MSFT' },
    { title: 'Netflix', val: 'NFLX', ticker: 'NFLX' },
    { title: 'Tesla', val: 'TSLA', ticker: 'TSLA' }
  ];

  form!: FormGroup;
  syncVal: any = [];
  componentData = ComponentData;

  emptyOptionIndexValue = this.options[0];
  openOnClearValue = this.options[3];

  isSingleLoading = false;
  isMultiLoading = false;
  externalError = '';

  private _singleFilterOptionSubject$ = new Subject<string>();
  singleOptionsObservable$?: Observable<any>;

  private _multiFilterOptionSubject$ = new Subject<string>();
  multiOptionsObservable$?: Observable<any>;

  validating = false;
  selectedOption: any = null;

  private readonly scenarioTelemetry = inject(CpsScenarioTelemetryService);
  private readonly logger = inject(CpsLoggerService).getLogger('autocomplete');

  /** The in-flight search per autocomplete, so a newer query can cancel it. */
  private singleSearchScenario?: CpsScenario;
  private multiSearchScenario?: CpsScenario;
  /** The in-flight selection validation, so a newer one can cancel it. */
  private validateScenario?: CpsScenario;

  private readonly _validateOptionSubject$ = new Subject<any>();
  private _validateSubscription?: Subscription;

  /** Per-side accessors for the two identically-shaped autocompletes. */
  private readonly _searchSides: Record<
    'single' | 'multi',
    {
      operation: 'single' | 'multi';
      getScenario: () => CpsScenario | undefined;
      setScenario: (scenario: CpsScenario | undefined) => void;
      setLoading: (loading: boolean) => void;
    }
  > = {
    single: {
      operation: 'single',
      getScenario: () => this.singleSearchScenario,
      setScenario: (scenario) => (this.singleSearchScenario = scenario),
      setLoading: (loading) => (this.isSingleLoading = loading)
    },
    multi: {
      operation: 'multi',
      getScenario: () => this.multiSearchScenario,
      setScenario: (scenario) => (this.multiSearchScenario = scenario),
      setLoading: (loading) => (this.isMultiLoading = loading)
    }
  };

  get availableOptionInfo() {
    return this.options.map((option) => option.name).join(', ');
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredAutocomplete: [this.options[1], [Validators.required]],
      hideDetailsAutocomplete: [null, [Validators.required]]
    });

    this.singleOptionsObservable$ = this._defineOptionsObservable(
      this._singleFilterOptionSubject$,
      'single'
    );

    this.multiOptionsObservable$ = this._defineOptionsObservable(
      this._multiFilterOptionSubject$,
      'multi'
    );

    this._validateSubscription = this._defineValidateOptionObservable();
  }

  ngOnDestroy(): void {
    this.singleSearchScenario?.cancel({ reason: 'component-destroyed' });
    this.multiSearchScenario?.cancel({ reason: 'component-destroyed' });
    this.validateScenario?.cancel({ reason: 'component-destroyed' });
    this._validateSubscription?.unsubscribe();
  }

  onSingleInputChanged(val: string) {
    this._inputChanged(val, this._singleFilterOptionSubject$);
  }

  onMultiInputChanged(val: string) {
    this._inputChanged(val, this._multiFilterOptionSubject$);
  }

  private _inputChanged(val: string, subject$: Subject<string>) {
    if (!val) return;
    subject$.next(val);
  }

  private _defineOptionsObservable(
    subject$: Subject<string>,
    side: 'single' | 'multi'
  ): Observable<any> | undefined {
    const state = this._searchSides[side];

    return subject$.pipe(
      switchMap((value) => {
        state.getScenario()?.cancel({ reason: 'superseded' });

        const scenario = this.scenarioTelemetry.start({
          name: 'autocomplete-search',
          feature: 'autocomplete',
          operation: state.operation
        });
        scenario.step('query');
        state.setScenario(scenario);
        state.setLoading(true);

        let resultCount = 0;
        return this._getOptionsFromServer(value).pipe(
          tap({
            next: (results: unknown[]) => {
              resultCount = results.length;
            },
            complete: () => {
              scenario.complete({ metadata: { resultCount } });
              this._clearSearchState(side);
            }
          }),
          catchError((error: unknown) => {
            this.logger.error('Autocomplete search failed', {
              error,
              context: 'Autocomplete',
              correlationId: scenario.id
            });
            scenario.fail({ error });
            this._clearSearchState(side);
            return of([]);
          })
        );
      })
    );
  }

  /** Resets the loading flag and forgets the finished scenario for one side. */
  private _clearSearchState(side: 'single' | 'multi'): void {
    const state = this._searchSides[side];
    state.setLoading(false);
    state.setScenario(undefined);
  }

  /** The `validate` counterpart of {@link _clearSearchState}. */
  private _clearValidateState(): void {
    this.validating = false;
    this.validateScenario = undefined;
  }

  private _getOptionsFromServer(val: string): Observable<any> {
    const filteredRes = this.options.filter((option) => {
      return option.name?.toLowerCase()?.includes(val);
    });
    return of(filteredRes).pipe(delay(1000));
  }

  /** Simulates async validation of a selected option with a delay. */
  private _validateOption(option: any): Observable<any> {
    return of(option).pipe(delay(3000));
  }

  // Method to handle selection changes for async validation
  onOptionSelected(option: any) {
    this.validating = true;
    this.selectedOption = option;
    this.externalError = '';
    this._validateOptionSubject$.next(option);
  }

  /** Routes selections through `switchMap` so a newer one cancels a running validation. */
  private _defineValidateOptionObservable(): Subscription {
    return this._validateOptionSubject$
      .pipe(
        switchMap((option) => {
          const scenario = this.scenarioTelemetry.start({
            name: 'autocomplete-validate',
            feature: 'autocomplete'
          });
          scenario.step('validate');
          this.validateScenario = scenario;

          return this._validateOption(option).pipe(
            traceScenario(scenario, {
              cancelOutcome: { reason: 'superseded' }
            }),
            tap(() => this._clearValidateState()),
            catchError((error: unknown) => {
              // Handle errors and finalize validation state
              this.externalError = 'Validation failed';
              this.logger.error('Autocomplete selection failed validation', {
                error,
                context: 'Autocomplete',
                correlationId: scenario.id
              });
              this._clearValidateState();
              return of(undefined);
            })
          );
        })
      )
      .subscribe();
  }

  readonly examples = autocompleteExamples;
}
