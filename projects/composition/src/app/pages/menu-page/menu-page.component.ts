import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsMenuComponent } from 'cps-ui-kit';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, CpsMenuComponent],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
  host: { class: 'composition-page' }
})
export class MenuPageComponent {}
