import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsCheckboxComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsCheckboxComponent, ReactiveFormsModule, FormsModule],
  selector: 'app-checkbox-page',
  templateUrl: './checkbox-page.component.html',
  styleUrls: ['./checkbox-page.component.scss'],
  host: { class: 'composition-page' },
})
export class CheckboxPageComponent {
  syncVal = true;
}
