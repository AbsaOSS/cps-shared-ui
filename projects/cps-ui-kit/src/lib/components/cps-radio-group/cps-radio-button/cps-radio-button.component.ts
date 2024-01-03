import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CpsRadioOption } from '../cps-radio-group.component';
import { CommonModule } from '@angular/common';
import { CpsTooltipDirective } from '../../../directives/cps-tooltip.directive';

let nextUniqueId = 0;

/**
 * CpsRadioButtonComponent is an internal radio button component.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule, CpsTooltipDirective],
  selector: 'cps-radio-button',
  templateUrl: './cps-radio-button.component.html',
  styleUrls: ['./cps-radio-button.component.scss']
})
export class CpsRadioButtonComponent {
  private _uniqueId = `cps-radio-button-${++nextUniqueId}`;

  /**
   * An option.
   * @group Props
   */
  @Input() option!: CpsRadioOption;

  /**
   * Determines whether the radio button is checked.
   * @group Props
   */
  @Input() checked = false;

  /**
   * Determines whether the radio button is disabled.
   * @group Props
   */
  @Input() groupDisabled = false;

  /**
   * Callback to invoke on value update.
   * @param {Event} event - Custom update value event.
   * @group Emits
   */
  @Output() updateValueEvent = new EventEmitter<Event>();

  get inputId(): string {
    return `${this._uniqueId}-input`;
  }

  updateValue(event: Event): void {
    event.preventDefault();
    if (this.option.disabled) return;
    this.updateValueEvent.emit(this.option.value);
  }
}
