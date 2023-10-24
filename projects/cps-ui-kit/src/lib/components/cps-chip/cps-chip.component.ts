import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';

/**
 * CpsChipComponent represents people using icons and labels.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-chip',
  templateUrl: './cps-chip.component.html',
  styleUrls: ['./cps-chip.component.scss']
})
export class CpsChipComponent implements OnChanges {
  /**
   * Label of the chip element.
   * @group Props
   */
  @Input() label = '';

  /**
   * Name of the icon.
   * @group Props
   */
  @Input() icon: IconType = '';

  /**
   * Position of the icon, it can be 'before' or 'after'.
   * @group Props
   */
  @Input() iconPosition: 'before' | 'after' = 'before';

  /**
   *Option for removing a selected chip element.
   * @group Props
   */
  @Input() closable = false;

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Callback to invoke on chip close.
   * @param {any} any - Chip closed.
   * @group Emits
   */
  @Output() closed = new EventEmitter();

  classesList = ['cps-chip'];

  ngOnChanges() {
    this.setClasses();
  }

  setClasses() {
    if (this.disabled) this.classesList.push('cps-chip-disabled');

    if (this.icon && this.label) {
      switch (this.iconPosition) {
        case 'before': {
          this.classesList.push('cps-chip--icon-before');
          break;
        }
        case 'after': {
          this.classesList.push('cps-chip--icon-after');
          break;
        }
      }
    }
  }

  onCloseClick(event: any) {
    event.stopPropagation();
    this.closed.emit();
  }
}
