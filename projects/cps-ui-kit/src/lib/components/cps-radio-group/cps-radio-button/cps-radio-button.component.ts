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
  /**
   * An array of items in the radio component of object type {
      value: any;
      label?: string;
      disabled?: boolean;
      tooltip?: string;
    }.
   * @group Props
   */
  @Input() option!: RadioOption;
  /**
   * Whether the radio button should be checked.
   * @group Props
   */
  @Input() checked = false;
  /**
   * If it is true, it specifies that the component should be disabled.
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
    this.updateValueEvent.emit(event);
  }
}
