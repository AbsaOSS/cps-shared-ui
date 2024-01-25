import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  CpsIconComponent,
  CpsTabGroupComponent,
  CpsTabComponent,
  TabChangeEvent
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tab-group.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsTabGroupComponent,
    CpsTabComponent,
    DocsViewerComponent
  ],
  selector: 'app-tab-group-page',
  templateUrl: './tab-group-page.component.html',
  styleUrls: ['./tab-group-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TabGroupPageComponent {
  selectedTabIndex = 0;
  componentData = ComponentData;

  changeTab({ currentTabIndex }: TabChangeEvent) {
    this.selectedTabIndex = currentTabIndex;
    console.log('Tab changed to: ' + currentTabIndex);
  }
}
