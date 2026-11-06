import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CpsTabComponent,
  CpsTabGroupComponent,
  CpsTableComponent
} from 'cps-ui-kit';

@Component({
  selector: 'app-nested-tabs-repro',
  imports: [CpsTabGroupComponent, CpsTabComponent, CpsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cps-tab-group
      data-testid="nested-reset-inner-tabs"
      animationType="slide"
      [isSubTabs]="true"
      [selectedIndex]="selectedTabIndex()"
      (afterTabChanged)="selectedTabIndex.set($event.newIndex)">
      <cps-tab label="Inner tab 1">
        <div style="height: 300px">
          <cps-table
            size="small"
            [hasToolbar]="false"
            [columns]="columns"
            [data]="data"></cps-table>
        </div>
      </cps-tab>
      <cps-tab label="Inner tab 2">
        <div style="height: 300px">
          <cps-table
            size="small"
            [hasToolbar]="false"
            [columns]="columns"
            [data]="data"></cps-table>
        </div>
      </cps-tab>
    </cps-tab-group>
  `
})
export class NestedTabsReproComponent {
  readonly selectedTabIndex = signal(0);
  readonly columns = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' }
  ];

  readonly data = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' },
    { id: 3, name: 'Gamma' }
  ];
}
