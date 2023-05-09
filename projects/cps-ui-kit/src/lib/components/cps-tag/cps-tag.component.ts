import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  Self,
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-tag',
  templateUrl: './cps-tag.component.html',
  styleUrls: ['./cps-tag.component.scss'],
})
export class CpsTagComponent implements ControlValueAccessor, OnChanges {
  @Input() type: 'security' | 'classification' | 'custom' = 'custom'; //higher precedence over color
  @Input() label = '';
  @Input() color = '';
  @Input() disabled = false;
  @Input() selectable = false;
  @Input() set value(value: boolean) {
    this._value = value;
    this.onChange(value);
  }
  get value(): boolean {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<boolean>();

  classesList: string[] = [];
  tagColor = '';

  private _value = false;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnChanges(): void {
    this.setClasses();
  }

  setClasses(): void {
    this.classesList = ['tag'];

    if (this.selectable) {
      this.classesList.push('tag--selectable');
    }
    if (this.disabled) {
      this.classesList.push('tag--disabled');
    }
    switch (this.type) {
      case 'security': {
        this.classesList.push('tag--security');
        break;
      }
      case 'classification': {
        this.classesList.push('tag--classification');
        break;
      }
      default:
        if (this.color) this.tagColor = getCSSColor(this.color);
    }
  }

  onChange = (event: any) => {};
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

  toggleSelected() {
    if (this.disabled || !this.selectable) return;
    this._updateValue(!this.value);
  }

  private _updateValue(value: boolean) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }
}
