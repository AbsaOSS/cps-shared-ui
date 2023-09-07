import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioOption } from '../cps-radio-group.component';
import { CommonModule } from '@angular/common';
import { CpsTooltipDirective } from '../../../directives/cps-tooltip.directive';

let nextUniqueId = 0;

@Component({
  standalone: true,
  imports: [CommonModule, CpsTooltipDirective],
  selector: 'cps-radio-button',
  templateUrl: './cps-radio-button.component.html',
  styleUrls: ['./cps-radio-button.component.scss']
})
export class CpsRadioButtonComponent {
  private _uniqueId = `cps-radio-button-${++nextUniqueId}`;

  @Input() option!: RadioOption;
  @Input() checked = false;
  @Input() groupDisabled = false;
  @Input() id: string = this._uniqueId;
  @Output() updateValueEvent = new EventEmitter<Event>();

  get inputId(): string {
    return `${this.id || this._uniqueId}-input`;
  }

  updateValue(event: Event): void {
    event.preventDefault();
    if (this.option.disabled) return;
    this.updateValueEvent.emit(event);
  }
}
