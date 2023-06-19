import { Component } from '@angular/core';
import { CpsProgressCircularComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsProgressCircularComponent],
  selector: 'app-progress-circular-page',
  templateUrl: './progress-circular-page.component.html',
  styleUrls: ['./progress-circular-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressCircularPageComponent {}
