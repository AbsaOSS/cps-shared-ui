import { Component } from '@angular/core';
import { CpsSchedulerComponent } from 'cps-ui-kit';
import ComponentData from '../../api-data/cps-scheduler.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-scheduler-page',
  imports: [CpsSchedulerComponent, ComponentDocsViewerComponent],
  templateUrl: './scheduler-page.component.html',
  styleUrl: './scheduler-page.component.scss',
  host: { class: 'composition-page' }
})
export class SchedulerPageComponent {
  componentData = ComponentData;

  cronExpression = '30 9 ? 7/4 WED#5 *';
  timeZone = 'UTC';

  onCronExpressionChanged(cron: string) {
    console.log('CRON expression', cron);
  }

  onTimezoneChanged(tz: string) {
    console.log('Time zone', tz);
  }
}
