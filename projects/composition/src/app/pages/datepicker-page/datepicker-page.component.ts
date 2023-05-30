import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpsDatepickerComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsDatepickerComponent, FormsModule],
  selector: 'app-datepicker-page',
  templateUrl: './datepicker-page.component.html',
  styleUrls: ['./datepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class DatepickerPageComponent {
  syncVal = new Date();
}
