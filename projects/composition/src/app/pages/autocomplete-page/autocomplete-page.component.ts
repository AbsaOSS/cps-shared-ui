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
import ComponentData from '../../api-data/cps-autocomplete.json';
import { Observable, Subject, of, delay } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    CpsAutocompleteComponent,
    FormsModule,
    ReactiveFormsModule,
    ComponentDocsViewerComponent,
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

  // New properties for the validating example
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
          // Handle errors and finalize loading state
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

  // Method to handle selection changes for async validation
  onOptionSelected(option: any) {
    this.validating = true;
    this.selectedOption = option;
    this.externalError = '';
    // Simulate async validation with a delay
    of(option)
      .pipe(
        delay(3000) // Simulate a delay of 2 seconds
      )
      .subscribe({
        next: () => {
          this.validating = false;
        },
        error: () => {
          // Handle errors and finalize loading state
          this.externalError = 'Validation failed';
        }
      });
  }
}
