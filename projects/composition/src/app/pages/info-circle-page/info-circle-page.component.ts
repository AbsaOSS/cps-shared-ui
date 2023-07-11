import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsInfoCircleComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-info-circle-page',
  standalone: true,
  imports: [CommonModule, CpsInfoCircleComponent],
  templateUrl: './info-circle-page.component.html',
  styleUrls: ['./info-circle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class InfoCirclePageComponent {}
