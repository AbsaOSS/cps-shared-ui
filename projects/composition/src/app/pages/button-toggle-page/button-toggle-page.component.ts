import { Component } from '@angular/core';
import { CpsButtonToggleComponent } from 'projects/cps-ui-kit/src/public-api';

@Component({
  standalone: true,
  imports: [CpsButtonToggleComponent],
  selector: 'app-button-toggle-page',
  templateUrl: './button-toggle-page.component.html',
  styleUrls: ['./button-toggle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonTogglePageComponent {}
