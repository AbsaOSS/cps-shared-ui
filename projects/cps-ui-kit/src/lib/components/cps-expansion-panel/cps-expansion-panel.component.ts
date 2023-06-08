import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-expansion-panel',
  templateUrl: './cps-expansion-panel.component.html',
  styleUrls: ['./cps-expansion-panel.component.scss']
})
export class CpsExpansionPanelComponent {
  @Input() headerTitle = '';
  @Input() backgroundColor = 'transparent';
  @Input() showChevron = true;
  @Input() isExpanded = false;
  @Input() disabled = false;
  @Input() bordered = true;
  @Input() borderRadius: number | string = '4px';
  @Output() afterCollapse: EventEmitter<void> = new EventEmitter<void>();
  @Output() afterExpand: EventEmitter<void> = new EventEmitter<void>();

  toggleExpansion(): void {
    if (!this.disabled) {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) {
        this.afterExpand.emit();
      }
      if (!this.isExpanded) {
        this.afterCollapse.emit();
      }
    }
  }
}
