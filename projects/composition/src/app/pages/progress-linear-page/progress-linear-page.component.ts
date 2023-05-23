import { Component } from '@angular/core';
import { CpsProgressLinearComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsProgressLinearComponent],
  selector: 'app-progress-linear-page',
  templateUrl: './progress-linear-page.component.html',
  styleUrls: ['./progress-linear-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressLinearPageComponent {}
