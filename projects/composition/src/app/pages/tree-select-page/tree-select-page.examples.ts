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

export const treeSelectExamples: Record<string, { html: string; ts?: string }> =
  {
    requiredTreeSelect: {
      html: `
<form [formGroup]="form">
  <cps-tree-select
    label="Required single tree select with a tooltip"
    [options]="options"
    optionLabel="label"
    optionInfo="attrType"
    placeholder="Select element"
    infoTooltip="Provide any information here"
    [clearable]="true"
    formControlName="requiredTreeSelect">
  </cps-tree-select>
</form>`,
      ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

${treeOptionsTs.trim()}

form!: UntypedFormGroup;

ngOnInit(): void {
  this.form = this._formBuilder.group({
    requiredTreeSelect: [this.options[1].children[0], [Validators.required]]
  });
}`
    },

    loadingTreeSelect: {
      html: `
<cps-tree-select
  label="Loading tree select"
  [loading]="true"
  [options]="options"
  [initialExpandAll]="true"
  hint="This tree select is currently in a loading state">
</cps-tree-select>`,
      ts: treeOptionsTs
    },

    disabledTreeSelect: {
      html: `
<cps-tree-select
  label="Disabled tree select"
  [disabled]="true"
  hint="This tree select is disabled">
</cps-tree-select>`
    },

    multipleTreeSelect: {
      html: `
<cps-tree-select
  label="Multiple tree select"
  [options]="options"
  optionLabel="label"
  optionInfo="attrType"
  [clearable]="false"
  [value]="selectedItems"
  [chips]="false"
  hint="This tree select is not clearable"
  [multiple]="true">
</cps-tree-select>`,
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

    virtualScrollTreeSelect: {
      html: `
<cps-tree-select
  label="Multiple tree select with virtual scroll, chips and persistent clear icon"
  [options]="options"
  optionLabel="label"
  hint="This tree select can handle large amounts of data due to virtual scroll"
  optionInfo="attrType"
  [value]="[options[1].children[0], options[2].children[0]]"
  [clearable]="true"
  [persistentClear]="true"
  [virtualScroll]="true"
  [multiple]="true">
</cps-tree-select>`,
      ts: treeOptionsTs
    },

    nonClosableChipsTreeSelect: {
      html: `
<cps-tree-select
  label="Multiple tree select with non-closable chips"
  [options]="options"
  optionInfo="attrType"
  hint="This tree select doesn't have a chevron icon"
  [showChevron]="false"
  [clearable]="true"
  [multiple]="true"
  [value]="[options[1].children[0], options[2].children[0]]"
  [closableChips]="false"></cps-tree-select>`,
      ts: treeOptionsTs
    },

    prefixIconTreeSelect: {
      html: `
<cps-tree-select
  label="Multiple tree select with prefix icon"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="plus"
  [value]="[options[2].children[0]]">
</cps-tree-select>`,
      ts: treeOptionsTs
    },

    twoWayBindingTreeSelect: {
      html: `
<div class="sync-val-example">
  <cps-tree-select
    [initialExpandDirectories]="true"
    width="31.25rem"
    label="Single tree select with two-way binding, select something"
    hint="This tree select has a fixed width of 31.25rem"
    [options]="options"
    optionInfo="attrType"
    optionLabel="label"
    [clearable]="true"
    [(ngModel)]="syncVal"
    [ngModelOptions]="{ standalone: true }">
  </cps-tree-select>
  <span class="sync-val">{{ syncVal?.label }}</span>
</div>`,
      ts: `
${treeOptionsTs.trim()}

syncVal: any = null;`
    },

    underlinedTreeSelect: {
      html: `
<cps-tree-select
  label="Underlined tree select"
  appearance="underlined"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false">
</cps-tree-select>`,
      ts: treeOptionsTs
    },

    borderlessTreeSelect: {
      html: `
<cps-tree-select
  label="Borderless tree select"
  appearance="borderless"
  [options]="options"
  optionInfo="attrType"
  [clearable]="true"
  [multiple]="true"
  [chips]="false">
</cps-tree-select>`,
      ts: treeOptionsTs
    }
  };
