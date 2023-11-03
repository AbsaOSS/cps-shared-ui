import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  QueryList,
  Renderer2,
  Self,
  ViewChildren
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { isEqual } from 'lodash-es';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import {
  CpsTooltipDirective,
  TooltipPosition
} from '../../directives/cps-tooltip.directive';

export type BtnToggleOption = {
  value: any;
  label: string;
  disabled?: boolean;
  tooltip?: string;
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CheckOptionSelectedPipe,
    CpsInfoCircleComponent,
    CpsTooltipDirective
  ],
  providers: [CheckOptionSelectedPipe],
  selector: 'cps-button-toggle',
  templateUrl: './cps-button-toggle.component.html',
  styleUrls: ['./cps-button-toggle.component.scss']
})
export class CpsButtonToggleComponent
  implements ControlValueAccessor, OnInit, AfterViewInit
{
  @Input() label = '';
  @Input() options = [] as BtnToggleOption[];
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() mandatory = true; // at least one of the options is mandatory
  @Input() equalWidths = true;
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: TooltipPosition = 'top';

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChildren('optionContent') optionsList!: QueryList<ElementRef>;

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
  }

  ngAfterViewInit(): void {
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

    const contentOptions =
      this.optionsList
        ?.toArray()
        ?.filter((opt) => opt?.nativeElement)
        ?.map((opt) => opt.nativeElement) || [];

    let largestButtonWidth = 0;
    contentOptions.forEach((elem) => {
      const buttonWidth = elem.offsetWidth || 0;
      if (buttonWidth > largestButtonWidth) {
        largestButtonWidth = buttonWidth;
      }
    });

    if (largestButtonWidth > 0) {
      contentOptions.forEach((elem) => {
        this.renderer.setStyle(elem, 'min-width', largestButtonWidth + 'px');
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}
}
