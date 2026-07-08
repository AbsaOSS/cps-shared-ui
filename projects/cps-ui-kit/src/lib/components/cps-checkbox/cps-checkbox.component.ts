import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import {
  CpsIconComponent,
  type CpsIconType
} from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';
import { logMissingAriaLabelError } from '../../utils/internal/accessibility-utils';

/**
 * CpsCheckboxComponent is a checkbox element.
 * @group Components
 */
@Component({
  imports: [CommonModule, CpsInfoCircleComponent, CpsIconComponent],
  selector: 'cps-checkbox',
  templateUrl: './cps-checkbox.component.html',
  styleUrls: ['./cps-checkbox.component.scss']
})
export class CpsCheckboxComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  /**
   * Label of the checkbox.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the checkbox, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Determines whether checkbox is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * InfoTooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Size of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Name of the icon.
   * @group Props
   */
  @Input() icon: CpsIconType = '';

  /**
   * Color of the icon.
   * @group Props
   */
  @Input() iconColor = 'text-dark';

  /**
   * Value of the checkbox.
   * @default false
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

  @ViewChild('checkboxInput')
  checkboxInput?: ElementRef<HTMLInputElement>;

  constructor(
    @Self() @Optional() private _control: NgControl,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.iconColor = getCSSColor(this.iconColor, this.document);
    logMissingAriaLabelError(
      'CpsCheckboxComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngOnChanges(): void {
    logMissingAriaLabelError(
      'CpsCheckboxComponent',
      this.label,
      this.ariaLabel
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (_event: any) => {};

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
  setDisabledState(_disabled: boolean) {}

  focus() {
    this.checkboxInput?.nativeElement?.focus();
  }
}
