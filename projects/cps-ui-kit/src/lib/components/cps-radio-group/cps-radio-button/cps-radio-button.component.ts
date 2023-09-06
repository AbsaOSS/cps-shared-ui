import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioOption } from '../cps-radio-group.component';
import { CommonModule } from '@angular/common';
import { CpsTooltipDirective } from '../../../directives/cps-tooltip.directive';

@Component({
  standalone: true,
  imports: [CommonModule, CpsTooltipDirective],
  selector: 'cps-radio-button',
  templateUrl: './cps-radio-button.component.html',
  styleUrls: ['./cps-radio-button.component.scss']
})
export class CpsRadioButtonComponent {
  @Input() option!: RadioOption;
  @Input() checked = false;
  @Input() groupDisabled = false;
  @Output() updateValueEvent = new EventEmitter<Event>();

  updateValue(event: Event): void {
    event.preventDefault();
    if (this.option.disabled) return;
    this.updateValueEvent.emit(event);
  }
}
