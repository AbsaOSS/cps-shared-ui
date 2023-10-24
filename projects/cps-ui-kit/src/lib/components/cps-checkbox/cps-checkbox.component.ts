import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { TooltipPosition } from '../../directives/cps-tooltip.directive';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';

/**
 * CpsCheckboxComponent is an extension to standard checkbox element with theming.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule, CpsInfoCircleComponent, CpsIconComponent],
  selector: 'cps-checkbox',
  templateUrl: './cps-checkbox.component.html',
  styleUrls: ['./cps-checkbox.component.scss']
})
export class CpsCheckboxComponent implements OnInit, ControlValueAccessor {
  /**
   * Label of the checkbox element.
   * @group Props
   */
  @Input() label = '';

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   *When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';
  /**
   * Info tooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Size of infoTooltip, of type number or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';
  /**
   * Whether the tooltip should have persistent info.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top' or 'bottom' or 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: TooltipPosition = 'top';

  /**
   * Name of the icon.
   * @group Props
   */
  @Input() icon: IconType = '';

  /**
   * Color of the icon.
   * @group Props
   */
  @Input() iconColor = 'text-dark';
  /**
   * Value specified in component.
   * @group Props
   */
  @Input() set value(value: boolean) {
    this._value = value;
    this.onChange(value);
  }

  get value(): boolean {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {boolean} boolean - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<boolean>();

  private _value = false;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.iconColor = getCSSColor(this.iconColor);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (event: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  writeValue(value: boolean) {
    this.value = value;
  }

  updateValueEvent(event: any) {
    event.preventDefault();
    if (this.disabled) return;
    this._updateValue(!this.value);
  }

  private _updateValue(value: boolean) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  focus() {
    this._elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
