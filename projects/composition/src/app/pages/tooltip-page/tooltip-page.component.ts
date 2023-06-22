import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsButtonComponent, CpsTooltipDirective } from 'cps-ui-kit';

@Component({
  selector: 'tooltip-page',
  standalone: true,
  imports: [CommonModule, CpsButtonComponent, CpsTooltipDirective],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {}
