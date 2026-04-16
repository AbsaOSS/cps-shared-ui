import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
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
  ariaLabel?: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
};

/**
 * CpsButtonToggleComponent is used to select values using buttons.
 * @group Components
 */
@Component({
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
   * Label of the button toggle component.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the button toggle component, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

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

  private _rootFontSizePx = 16;

  constructor(
    @Self() @Optional() private _control: NgControl,
    @Inject(DOCUMENT) private document: Document,
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
    this._rootFontSizePx = parseFloat(
      getComputedStyle(this.document.documentElement).fontSize || '16'
    );
    if (this.document?.fonts?.ready) {
      this.document.fonts.ready.then(() => this._setEqualWidths());
    } else {
      this._setEqualWidths();
    }
  }

  ngOnChanges() {
    if (!this.label?.trim() && !this.ariaLabel?.trim()) {
      console.error(
        'CpsButtonToggleComponent: unlabeled button toggle component must have an ariaLabel for accessibility.'
      );
    }
    const hasInaccessibleOption = this.options.some(
      (opt) => !opt.label?.trim() && !opt.ariaLabel?.trim()
    );
    if (hasInaccessibleOption) {
      console.error(
        'CpsButtonToggleComponent: each unlabeled option must have an ariaLabel for accessibility.'
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (event: any) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  writeValue(value: any) {
    this.value = value;
  }

  updateValueOnClick(val: any) {
    if (this.disabled) return;

    if (this.multiple) {
      const current: any[] = Array.isArray(this.value) ? this.value : [];
      const isSelected = current.some((v) => isEqual(v, val));
      let next: any[];

      if (isSelected) {
        if (this.mandatory && current.length === 1) {
          return;
        }
        next = current.filter((v) => !isEqual(v, val));
      } else {
        next = [...current, val];
      }
      const ordered = this.options
        .map((o) => o.value)
        .filter((v) => next.some((n) => isEqual(n, v)));

      this._updateValue(ordered);
      return;
    }

    if (this.mandatory) {
      this._updateValue(val);
      return;
    }

    const isSame = isEqual(this.value, val);
    this._updateValue(isSame ? undefined : val);
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
    this.renderer.setStyle(hiddenSpan, 'font-size', '1rem');
    this.renderer.setStyle(hiddenSpan, 'letter-spacing', '0.05em');
    this.renderer.setStyle(
      hiddenSpan,
      'font-family',
      '"Source Sans Pro", sans-serif'
    );

    this.renderer.appendChild(this.document.body, hiddenSpan);

    this.largestButtonWidth = 0;
    this.options.forEach((opt) => {
      const label = opt.label || '';
      this.renderer.setProperty(hiddenSpan, 'textContent', label);

      const textWidth = hiddenSpan.offsetWidth || 0;
      let totalWidth = textWidth + 26;
      if (opt.icon) {
        totalWidth += 16;
        if (label) totalWidth += 8;
      }

      const totalWidthRem = this._pxToRem(totalWidth);
      this.largestButtonWidth = Math.max(
        this.largestButtonWidth,
        totalWidthRem
      );
    });

    this.renderer.removeChild(this.document.body, hiddenSpan);
  }

  private _pxToRem(px: number): number {
    return px / this._rootFontSizePx;
  }
}
