import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tooltip-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {}
