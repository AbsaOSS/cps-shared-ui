const treeOptionsTs = `
options = [
  {
    isDirectory: true, // RESERVED KEY
    label: 'Dataset 1',
    children: [
      {
        label: 'Attr1_1',
        data: 'This is attribute 1 1',
        attrType: 'struct',
        children: [
          {
            label: 'AttrA',
            desc: 'Attribute A'
          },
          {
            label: 'AttrB',
            info: 'AttrB',
            attrType: 'number'
          }
        ]
      },
      {
        label: 'Attr2_1',
        data: 'This is attribute 2 1',
        attrType: 'struct',
        children: [
          {
            label: 'AttrC',
            desc: 'C'
          }
        ]
      }
    ]
  },
  {
    isDirectory: true, // RESERVED KEY
    label: 'Dataset 2',
    children: [
      {
        label: 'Attr1_2',
        data: 'attr1 data'
      },
      {
        label: 'Attr2_2',
        desc: 'attr2 desc'
      },
      {
        label: 'Attr3_2',
        data: 'attr3 data'
      }
    ]
  },
  {
    isDirectory: true, // RESERVED KEY
    label: 'Dataset 3',
    children: [
      {
        label: 'Attr1_3',
        data: 'attr1 data',
        children: [
          {
            label: 'Attr1 A',
            data: 'attr 1 a data',
            attrType: 'decimal'
          },
          {
            label: 'Attr1 B',
            desc: 'Attr1 b desc'
          }
        ]
      },
      {
        label: 'Attr2_3',
        data: 'De Niro Movies',
        attrType: 'struct',
        children: [
          {
            label: 'Attr2 A',
            data: 'attr2 a data',
            description: 'attr2 a description'
          }
        ]
      }
    ]
  }
];`;

export const treeAutocompleteExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  requiredTreeAutocomplete: {
    html: `
<form [formGroup]="form">
  <cps-tree-autocomplete
    label="Required single tree autocomplete with a tooltip"
    [options]="options"
    optionLabel="label"
    optionInfo="attrType"
    placeholder="Select element"
    infoTooltip="Provide any information here"
    [clearable]="true"
    formControlName="requiredTreeAutocomplete">
  </cps-tree-autocomplete>
</form>`,
    ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

${treeOptionsTs.trim()}

form!: UntypedFormGroup;

ngOnInit(): void {
  this.form = this._formBuilder.group({
    requiredTreeAutocomplete: [
      this.options[1].children[0],
      [Validators.required]
    ]
  });
}`
  },

  loadingTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Loading tree autocomplete"
  [loading]="true"
  [options]="options"
  [initialExpandAll]="true"
  hint="This tree autocomplete is currently in a loading state">
</cps-tree-autocomplete>`,
    ts: treeOptionsTs
  },

  disabledTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Disabled tree autocomplete"
  [disabled]="true"
  hint="This tree autocomplete is disabled">
</cps-tree-autocomplete>`
  },

  multipleTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Multiple tree autocomplete"
  [options]="options"
  optionLabel="label"
  optionInfo="attrType"
  [clearable]="false"
  [value]="selectedItems"
  [chips]="false"
  hint="This tree autocomplete is not clearable"
  [multiple]="true">
</cps-tree-autocomplete>`,
    ts: `
${treeOptionsTs.trim()}

selectedItems = [
  {
    label: 'AttrB',
    info: 'AttrB',
    attrType: 'number'
  }
];`
  },

  virtualScrollTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Multiple tree autocomplete with virtual scroll, chips and persistent clear icon"
  [options]="options"
  optionLabel="label"
  hint="This tree autocomplete can handle large amounts of data due to virtual scroll"
  optionInfo="attrType"
  [value]="[options[1].children[0], options[2].children[0]]"
  [clearable]="true"
  [persistentClear]="true"
  [virtualScroll]="true"
  [multiple]="true">
</cps-tree-autocomplete>`,
    ts: treeOptionsTs
  },

  nonClosableChipsTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Multiple tree autocomplete with non-closable chips"
  [options]="options"
  optionInfo="attrType"
  hint="This tree autocomplete doesn't have a chevron icon"
  [showChevron]="false"
  [clearable]="true"
  [multiple]="true"
  [value]="[options[1].children[0], options[2].children[0]]"
  [closableChips]="false"></cps-tree-autocomplete>`,
    ts: treeOptionsTs
  },

  prefixIconTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Multiple tree autocomplete with prefix icon"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  [value]="[options[2].children[0]]">
</cps-tree-autocomplete>`,
    ts: treeOptionsTs
  },

  twoWayBindingTreeAutocomplete: {
    html: `
<div class="sync-val-example">
  <cps-tree-autocomplete
    [initialExpandDirectories]="true"
    width="31.25rem"
    label="Single tree autocomplete with two-way binding, enter something"
    hint="This tree autocomplete has a fixed width of 31.25rem"
    [options]="options"
    optionInfo="attrType"
    optionLabel="label"
    [clearable]="true"
    [(ngModel)]="syncVal"
    [ngModelOptions]="{ standalone: true }">
  </cps-tree-autocomplete>
  <span class="sync-val">{{ syncVal?.label }}</span>
</div>`,
    ts: `
${treeOptionsTs.trim()}

syncVal: any = null;`
  },

  underlinedTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Underlined tree autocomplete"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  appearance="underlined"
  prefixIcon="search">
</cps-tree-autocomplete>`,
    ts: treeOptionsTs
  },

  borderlessTreeAutocomplete: {
    html: `
<cps-tree-autocomplete
  label="Borderless tree autocomplete"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  appearance="borderless"
  prefixIcon="search">
</cps-tree-autocomplete>`,
    ts: treeOptionsTs
  }
};
