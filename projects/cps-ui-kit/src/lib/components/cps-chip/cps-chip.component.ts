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
 * CpsChipComponent represents a chip element.
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
   * Color of the icon.
   * @group Props
   */
  @Input() iconColor = 'text-darkest';

  /**
   * Position of the icon, it can be 'before' or 'after'. Defaults to 'before'.
   * @group Props
   */
  @Input() iconPosition: 'before' | 'after' = 'before';

  /**
   * Option for closing a chip element.
   * @group Props
   */
  @Input() closable = false;

  /**
   * Determines whether chip is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Callback to invoke on chip close.
   * @param {string} string - Chip closed.
   * @group Emits
   */
  @Output() closed = new EventEmitter<string>();

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
    this.closed.emit(this.label);
  }
}
