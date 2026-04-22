import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { CpsRadioOption } from '../cps-radio-group.component';
import { CommonModule } from '@angular/common';
import { CpsTooltipDirective } from '../../../directives/cps-tooltip/cps-tooltip.directive';
import { generateUniqueId } from '../../../utils/internal/accessibility-utils';

/**
 * CpsRadioButtonComponent is an internal radio button component.
 * @group Components
 */
@Component({
  imports: [CommonModule, CpsTooltipDirective],
  selector: 'cps-radio-button',
  templateUrl: './cps-radio-button.component.html',
  styleUrls: ['./cps-radio-button.component.scss']
})
export class CpsRadioButtonComponent implements OnChanges {
  /**
   * Name attribute for the radio input, used to group buttons within the same radio group.
   * @group Props
   */
  @Input() groupName = '';

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

  /**
   * Callback to invoke when the radio button loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  /**
   * Callback to invoke when the radio button receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  readonly inputId = generateUniqueId('cps-radio-button-input');

  ngOnChanges(): void {
    if (!this.option.label?.trim() && !this.option.ariaLabel?.trim()) {
      console.error(
        'CpsRadioButtonComponent: unlabeled radio button component must have an ariaLabel for accessibility.'
      );
    }
  }

  updateValue(event: Event): void {
    event.preventDefault();
    if (this.option.disabled) return;
    this.updateValueEvent.emit(this.option.value);
  }

  onBlur() {
    this.blurred.emit();
  }

  onFocus() {
    this.focused.emit();
  }
}
