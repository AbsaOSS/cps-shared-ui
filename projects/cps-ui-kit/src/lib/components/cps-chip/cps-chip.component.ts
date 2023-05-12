import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-chip',
  templateUrl: './cps-chip.component.html',
  styleUrls: ['./cps-chip.component.scss'],
})
export class CpsChipComponent implements OnChanges {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPosition: 'before' | 'after' = 'before';
  @Input() closable = false;
  @Input() disabled = false;

  @Output() closed = new EventEmitter();

  classesList = ['chip'];

  ngOnChanges() {
    this.setClasses();
  }

  setClasses() {
    if (this.disabled) this.classesList.push('chip-disabled');

    if (this.icon && this.label) {
      switch (this.iconPosition) {
        case 'before': {
          this.classesList.push('chip--icon-before');
          break;
        }
        case 'after': {
          this.classesList.push('chip--icon-after');
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
