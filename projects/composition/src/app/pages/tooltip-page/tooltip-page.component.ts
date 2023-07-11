import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CpsButtonComponent,
  CpsCheckboxComponent,
  CpsTooltipDirective
} from 'cps-ui-kit';

@Component({
  selector: 'tooltip-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsButtonComponent,
    CpsTooltipDirective,
    CpsCheckboxComponent
  ],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {
  ttipEnabled = false;
}
