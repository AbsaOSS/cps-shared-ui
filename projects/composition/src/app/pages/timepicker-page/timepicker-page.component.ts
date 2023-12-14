import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTimepickerComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-timepicker-page',
  standalone: true,
  imports: [CommonModule, CpsTimepickerComponent],
  templateUrl: './timepicker-page.component.html',
  styleUrls: ['./timepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TimepickerPageComponent {}
