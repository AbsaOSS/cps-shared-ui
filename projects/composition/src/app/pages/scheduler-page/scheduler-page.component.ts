import { Component } from '@angular/core';
import { CpsSchedulerComponent } from 'cps-ui-kit';
import ComponentData from '../../api-data/cps-scheduler.json';
import ServiceData from '../../api-data/cps-cron-validation.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { schedulerExamples } from './scheduler-page.examples';

@Component({
  selector: 'app-scheduler-page',
  imports: [
    CpsSchedulerComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './scheduler-page.component.html',
  host: { class: 'composition-page' }
})
export class SchedulerPageComponent {
  componentData = ComponentData;
  serviceData = [ServiceData];
  readonly examples = schedulerExamples;

  cronExpression = '30 9 ? 7/4 WED#5 *';
  timeZone = 'UTC';

  onCronExpressionChanged(cron: string) {
    console.log('CRON expression', cron);
  }

  onTimezoneChanged(tz: string) {
    console.log('Time zone', tz);
  }
}
