export const autocompleteExamples = {
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
