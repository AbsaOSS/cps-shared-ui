import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CpsButtonComponent, CpsChipComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CommonModule, CpsChipComponent, CpsButtonComponent],
  selector: 'app-chip-page',
  templateUrl: './chip-page.component.html',
  styleUrls: ['./chip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ChipPageComponent {
  chipClosed = false;

  onToggleChip() {
    this.chipClosed = !this.chipClosed;
  }
}
