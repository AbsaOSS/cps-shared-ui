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
} from '../../directives/cps-tooltip.directive';

export type CpsButtonToggleOption = {
  value: any;
  label?: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
};

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
  @Input() label = '';
  @Input() options = [] as CpsButtonToggleOption[];
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() mandatory = true; // at least one of the options is mandatory
  @Input() equalWidths = true;
  @Input() optionTooltipPosition: CpsTooltipPosition = 'bottom';
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

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

  updateValueEvent(event: any) {
    if (this.disabled) return;
    const check = event?.target?.checked || false;

    if (this.mandatory && this.multiple && !check && this.value.length < 2) {
      event.target.checked = true;
      return;
    }

    const val = event?.target?.value || undefined;

    if (this.multiple) {
      let res = [] as any;
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
