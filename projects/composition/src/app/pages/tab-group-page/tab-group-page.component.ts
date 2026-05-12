import { Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CpsTabGroupComponent,
  CpsTabComponent,
  CpsTabChangeEvent,
  CpsCheckboxComponent
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tab-group.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  imports: [
    NgTemplateOutlet,
    CpsTabGroupComponent,
    CpsTabComponent,
    CpsCheckboxComponent,
    ComponentDocsViewerComponent
  ],
  selector: 'app-tab-group-page',
  templateUrl: './tab-group-page.component.html',
  styleUrls: ['./tab-group-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TabGroupPageComponent {
  componentData = ComponentData;
  selectedTabIndex = 1;

  changeTab({ newIndex }: CpsTabChangeEvent) {
    console.log('Tab changed to: ' + newIndex);
  }

  centerAlignedTabs = [
    {
      label: 'Tab 1',
      badgeValue: '7',
      badgeTooltip: 'First tab badge',
      disabled: false
    },
    { label: 'Tab 2', badgeValue: '', badgeTooltip: '', disabled: false },
    {
      label: 'Tab 3',
      badgeValue: '5',
      badgeTooltip: 'Third tab badge',
      disabled: false
    },
    { label: 'Tab 4', badgeValue: '', badgeTooltip: '', disabled: true }
  ];

  leftAlignedTabs = Array.from({ length: 20 }, (_, i) => ({
    label: `Tab ${i + 1}`,
    tooltipText: `Tooltip of tab ${i + 1}`
  }));

  rightAlignedTabs = [
    { label: 'Tab 1', icon: 'survivorship', id: 'tab1' },
    { label: 'Tab 2', icon: 'kris', id: null },
    { label: 'Tab 3', icon: 'dq', id: null }
  ];

  stretchedTabs = [{ label: 'Tab 1' }, { label: 'Tab 2' }, { label: 'Tab 3' }];

  subTabs = [
    { label: 'Tab 1', icon: 'avatar', id: 'tab1' },
    { label: 'Tab 2', icon: '', id: null },
    { label: 'Tab 3', icon: '', id: null }
  ];
}
