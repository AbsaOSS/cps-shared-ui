import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from 'projects/cps-ui-kit/src/lib/directives/tooltip.directive';
import { CpsButtonComponent } from 'cps-ui-kit';

@Component({
  selector: 'tooltip-page',
  standalone: true,
  imports: [CommonModule, CpsButtonComponent, TooltipDirective],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {}
