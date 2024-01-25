import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsTreeSelectComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tree-select.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsTreeSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    DocsViewerComponent
  ],
  selector: 'app-tree-select-page',
  templateUrl: './tree-select-page.component.html',
  styleUrls: ['./tree-select-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TreeSelectPageComponent implements OnInit {
  selectedItems = [
    {
      label: 'AttrB',
      info: 'AttrB',
      attrType: 'number'
    }
  ];

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
  ];

  form!: UntypedFormGroup;
  syncVal: any = null;

  componentData = ComponentData;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredTreeSelect: [this.options[1].children[0], [Validators.required]]
    });
  }
}
