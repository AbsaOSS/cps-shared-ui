import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsTreeSelectComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsTreeSelectComponent, FormsModule, ReactiveFormsModule],
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
    },
    {
      label: 'Untouchables',
      data: 'Untouchables Movie'
    }
  ];

  options = [
    {
      type: 'directory', // RESERVED KEY
      label: 'Dataset1',
      children: [
        {
          label: 'Attr1',
          data: 'This is attribute 1',
          attrType: 'string',
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
          label: 'Attr2',
          data: 'This is attribute 2',
          children: [
            {
              label: 'Invoices.txt',
              data: 'Invoices for this month'
            }
          ]
        }
      ]
    },
    {
      type: 'directory',
      label: 'Events',
      data: 'Events Folder',
      children: [
        {
          label: 'Meeting',
          data: 'Meeting'
        },
        {
          label: 'Home',
          data: 'Product Launch'
        },
        {
          label: 'Report Review',
          data: 'Report Review'
        }
      ]
    },
    {
      label: 'Movies',
      data: 'Movies Folder',
      children: [
        {
          label: 'Al Pacino',
          data: 'Pacino Movies',
          children: [
            {
              label: 'Scarface',
              data: 'Scarface Movie'
            },
            {
              label: 'Serpico',
              data: 'Serpico Movie'
            }
          ]
        },
        {
          label: 'Robert De Niro',
          data: 'De Niro Movies',
          children: [
            {
              label: 'Goodfellas',
              data: 'Goodfellas Movie'
            },
            {
              label: 'Untouchables',
              data: 'Untouchables Movie'
            }
          ]
        }
      ]
    }
  ];

  form!: UntypedFormGroup;
  syncVal: any = null;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredTreeSelect: [this.options[1].children[0], [Validators.required]]
    });
  }
}
