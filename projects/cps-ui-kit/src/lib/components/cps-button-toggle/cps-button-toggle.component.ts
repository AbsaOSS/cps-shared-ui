import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  Renderer2,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { isEqual } from 'lodash-es';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import {
  CpsTooltipDirective,
  CpsTooltipPosition
} from '../../directives/cps-tooltip/cps-tooltip.directive';

/**
 * CpsButtonToggleOption is used to define the options of the CpsButtonToggleComponent.
 * @group Types
 */
export type CpsButtonToggleOption = {
  value: any;
  label?: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
};

/**
 * CpsButtonToggleComponent is used to select values using buttons.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    CheckOptionSelectedPipe,
    CpsInfoCircleComponent,
    CpsIconComponent,
    CpsTooltipDirective
  ],
  providers: [CheckOptionSelectedPipe],
  selector: 'cps-button-toggle',
  templateUrl: './cps-button-toggle.component.html',
  styleUrls: ['./cps-button-toggle.component.scss']
})
export class CpsButtonToggleComponent implements ControlValueAccessor, OnInit {
  /**
   * Label of the toggle buttons.
   * @group Props
   */
  @Input() label = '';

  /**
   * An array of options.
   * @group Props
   */
  @Input() options: CpsButtonToggleOption[] = [];

  /**
   * Specifies if multiple values can be selected.
   * @group Props
   */
  @Input() multiple = false;

  /**
   * Specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether at least one of the options is mandatory.
   * @group Props
   */
  @Input() mandatory = true;

  /**
   * Determines whether all buttons should have equal widths.
   * @group Props
   */
  @Input() equalWidths = true;

  /**
   * Position of the option tooltip, can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() optionTooltipPosition: CpsTooltipPosition = 'bottom';

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
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
   * Value of the component.
   * @group Props
   */
  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {any} any - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<any>();

  largestButtonWidth = 0;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private renderer: Renderer2
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit() {
    if (this.multiple && !this._value) {
      this._value = [];
    }
    this._setEqualWidths();
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

  writeValue(value: any) {
    this.value = value;
  }

  updateValueEvent(event: any, val: any) {
    if (this.disabled) return;
    const check = event?.target?.checked || false;

    if (this.mandatory && this.multiple && !check && this.value.length < 2) {
      event.target.checked = true;
      return;
    }

    if (this.multiple) {
      let res = [];
      if (!check) {
        res = this.value.filter((v: any) => !isEqual(v, val));
      } else {
        this.options.forEach((o) => {
          if (
            this.value.some((v: any) => isEqual(v, o.value)) ||
            isEqual(val, o.value)
          ) {
            res.push(o.value);
          }
        });
      }
      this._updateValue(res);
    } else {
      if (this.mandatory) {
        this._updateValue(val); // radio
      } else {
        this._updateValue(check ? val : undefined);
      }
    }
  }

  private _updateValue(value: any) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _setEqualWidths() {
    if (!this.equalWidths) return;

    const hiddenSpan = this.renderer.createElement('span');
    this.renderer.setStyle(hiddenSpan, 'visibility', 'hidden');
    this.renderer.setStyle(hiddenSpan, 'position', 'absolute');
    this.renderer.setStyle(hiddenSpan, 'left', '-9999px');
    this.renderer.setStyle(hiddenSpan, 'font-size', '16px');
    this.renderer.setStyle(hiddenSpan, 'letter-spacing', '0.05em');
    this.renderer.setStyle(
      hiddenSpan,
      'font-family',
      '"Source Sans Pro", sans-serif'
    );

    this.renderer.appendChild(document.body, hiddenSpan);

    this.largestButtonWidth = 0;
    this.options.forEach((opt) => {
      const text = this.renderer.createText(opt.label || '');
      this.renderer.appendChild(hiddenSpan, text);

      let width = hiddenSpan.offsetWidth || 0;
      width += 26;
      if (opt.icon) {
        width += 16;
        if (opt.label) width += 8;
      }
      if (width > this.largestButtonWidth) {
        this.largestButtonWidth = width;
      }
      this.renderer.removeChild(hiddenSpan, text);
    });

    this.renderer.removeChild(document.body, hiddenSpan);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}
}
