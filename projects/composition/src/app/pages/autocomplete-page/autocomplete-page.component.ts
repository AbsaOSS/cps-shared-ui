import { Component, OnInit } from '@angular/core';
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
import { Observable, Subject, of, delay } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

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
  host: { class: 'composition-page' }
})
export class AutocompletePageComponent implements OnInit {
  options = [
    { name: 'New York', data: { code: 'NY' } },
    { name: 'Prague', data: { code: 'PRG' }, info: 'Prague info' },
    { name: 'Capetown', data: { code: 'CPT' }, info: 'Capetown info' },
    { name: 'Rome', data: { code: 'RM' } },
    { name: 'London', data: { code: 'LDN' }, info: 'London info' },
    { name: 'Istanbul', data: { code: 'IST' } },
    { name: 'Paris', data: { code: 'PRS' } },
    { name: 'Tokyo', data: { code: 'TOK' } },
    { name: 'Oslo', data: { code: 'OSL' }, info: 'Oslo info' },
    { name: 'Berlin', data: { code: 'BER' } }
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

  isSingleLoading = false;
  isMultiLoading = false;
  externalError = '';

  private _singleFilterOptionSubject$ = new Subject<string>();
  singleOptionsObservable$?: Observable<any>;

  private _multiFilterOptionSubject$ = new Subject<string>();
  multiOptionsObservable$?: Observable<any>;

  validating = false;
  selectedOption: any = null;

  get availableOptionInfo() {
    return this.options.map((option) => option.name).join(', ');
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredAutocomplete: [this.options[1], [Validators.required]]
    });

    this.singleOptionsObservable$ = this._defineOptionsObservable(
      this._singleFilterOptionSubject$,
      true
    );

    this.multiOptionsObservable$ = this._defineOptionsObservable(
      this._multiFilterOptionSubject$,
      false
    );
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
    single: boolean
  ): Observable<any> | undefined {
    return subject$.pipe(
      switchMap((value) => {
        if (single) this.isSingleLoading = true;
        else this.isMultiLoading = true;
        return this._getOptionsFromServer(value).pipe(
          tap({
            complete: () => {
              if (single) this.isSingleLoading = false;
              else this.isMultiLoading = false;
            }
          })
        );
      })
    );
  }

  private _getOptionsFromServer(val: string): Observable<any> {
    const filteredRes = this.options.filter((option) => {
      return option.name?.toLowerCase()?.includes(val);
    });
    return of(filteredRes).pipe(delay(1000));
  }

  onOptionSelected(option: any) {
    this.validating = true;
    this.selectedOption = option;
    this.externalError = '';
    of(option)
      .pipe(delay(3000))
      .subscribe({
        next: () => {
          this.validating = false;
        },
        error: () => {
          this.externalError = 'Validation failed';
        }
      });
  }

  readonly examples = {
    required: `
<cps-autocomplete
  label="Required single autocomplete with a tooltip"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  infoTooltip="Provide any information here"
  placeholder="Enter a city"
  [clearable]="true"
  formControlName="requiredAutocomplete">
</cps-autocomplete>`,

    singleAsync: `
<cps-autocomplete
  label="Single search autocomplete with fetched options list"
  hint="Fetches matching options from the server based on user input"
  [options]="singleOptionsObservable$ | async"
  optionLabel="name"
  optionInfo="info"
  placeholder="Search a city"
  [clearable]="true"
  [loading]="isSingleLoading"
  loadingMessage="Loading cities..."
  emptyMessage="No cities found"
  (inputChanged)="onSingleInputChanged($event)">
</cps-autocomplete>`,

    multipleAsync: `
<cps-autocomplete
  label="Multiple search autocomplete with fetched options list"
  hint="Fetches matching options from the server based on user input"
  [options]="multiOptionsObservable$ | async"
  optionLabel="name"
  optionInfo="info"
  placeholder="Search cities"
  [clearable]="true"
  [multiple]="true"
  [loading]="isMultiLoading"
  loadingMessage="Loading cities..."
  emptyMessage="No cities found"
  (inputChanged)="onMultiInputChanged($event)">
</cps-autocomplete>`,

    disabled: `
<cps-autocomplete
  label="Disabled autocomplete"
  [disabled]="true"
  hint="This autocomplete is disabled">
</cps-autocomplete>`,

    multipleNotClearable: `
<cps-autocomplete
  label="Multiple autocomplete"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="false"
  [multiple]="true"
  [chips]="false"
  [returnObject]="false"
  [value]="[{ code: 'CPT' }]"
  hint="This autocomplete is not clearable">
</cps-autocomplete>`,

    virtualScroll: `
<cps-autocomplete
  label="Multiple autocomplete with virtual scroll, chips and persistent clear icon"
  [options]="options"
  hint="This autocomplete doesn't have Select All option"
  [virtualScroll]="true"
  [selectAll]="false"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [persistentClear]="true"
  [value]="[options[0], options[4]]">
</cps-autocomplete>`,

    nonClosableChips: `
<cps-autocomplete
  label="Multiple autocomplete with non-closable chips"
  [returnObject]="false"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Enter a city"
  hint="This autocomplete doesn't have a chevron icon"
  [showChevron]="false"
  [clearable]="true"
  [multiple]="true"
  [closableChips]="false"
  [value]="[options[0].data, options[4].data]">
</cps-autocomplete>`,

    prefixIcon: `
<cps-autocomplete
  label="Multiple autocomplete with prefix icon"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  [value]="[options[5]]">
</cps-autocomplete>`,

    twoWayBinding: `
<cps-autocomplete
  width="31.25rem"
  label="Multiple autocomplete with two-way binding and keeping initial items order"
  [returnObject]="false"
  [options]="syncOptions"
  [keepInitialOrder]="true"
  optionLabel="title"
  optionValue="val"
  optionInfo="ticker"
  placeholder="Enter a company"
  hint="This autocomplete has a fixed width of 500px"
  [clearable]="true"
  [multiple]="true"
  [closableChips]="false"
  [(ngModel)]="syncVal"
  [ngModelOptions]="{ standalone: true }">
</cps-autocomplete>
<span>{{ syncVal }}</span>`,

    underlined: `
<cps-autocomplete
  label="Underlined autocomplete"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  appearance="underlined">
</cps-autocomplete>`,

    borderless: `
<cps-autocomplete
  label="Borderless autocomplete"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  appearance="borderless">
</cps-autocomplete>`,

    asyncValidation: `
<cps-autocomplete
  label="Autocomplete with async validation"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [(ngModel)]="selectedOption"
  [ngModelOptions]="{ standalone: true }"
  [validating]="validating"
  (valueChanged)="onOptionSelected($event)"
  [externalError]="externalError"
  hint="Simulates async validation upon selection">
</cps-autocomplete>`
  };
}
