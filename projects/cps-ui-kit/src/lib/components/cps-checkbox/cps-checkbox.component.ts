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
import { CpsTooltipPosition } from '../../directives/cps-tooltip.directive';
import { CpsIconComponent, IconType } from '../cps-icon/cps-icon.component';
import { getCSSColor } from '../../utils/colors-utils';

@Component({
  standalone: true,
  imports: [CommonModule, CpsInfoCircleComponent, CpsIconComponent],
  selector: 'cps-checkbox',
  templateUrl: './cps-checkbox.component.html',
  styleUrls: ['./cps-checkbox.component.scss']
})
export class CpsCheckboxComponent implements OnInit, ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';
  @Input() icon: IconType = '';
  @Input() iconColor = 'text-dark';

  @Input() set value(value: boolean) {
    this._value = value;
    this.onChange(value);
  }

  get value(): boolean {
    return this._value;
  }

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
