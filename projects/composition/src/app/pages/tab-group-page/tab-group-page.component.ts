import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  CpsTabGroupComponent,
  CpsTabComponent,
  CpsTabChangeEvent
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tab-group.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  imports: [
    CommonModule,
    CpsTabGroupComponent,
    CpsTabComponent,
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
}
