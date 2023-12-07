import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  Self
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { ControlValueAccessor, NgControl } from '@angular/forms';

/**
 * CpsTagComponent is used to categorize content.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-tag',
  templateUrl: './cps-tag.component.html',
  styleUrls: ['./cps-tag.component.scss']
})
export class CpsTagComponent implements ControlValueAccessor, OnChanges {
  /**
   * Type of the tag. It can be security, classification or custom, has higher precedence over color
   * @group Props
   */
  @Input() type: 'security' | 'classification' | 'custom' = 'custom';

  /**
   * Label of the tag.
   * @group Props
   */
  @Input() label = '';

  /**
   * Color of the tag.
   * @group Props
   */
  @Input() color = '';

  /**
   * Whether the tag should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Whether the tag should be selectable.
   * @group Props
   */
  @Input() selectable = false;

  /**
   * Tag value.
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
   * @param {any} event - Browser event.
   * @group Emits
   */
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
    this.classesList = ['cps-tag'];

    if (this.selectable) {
      this.classesList.push('cps-tag--selectable');
    }
    if (this.disabled) {
      this.classesList.push('cps-tag--disabled');
    }
    switch (this.type) {
      case 'security': {
        this.classesList.push('cps-tag--security');
        break;
      }
      case 'classification': {
        this.classesList.push('cps-tag--classification');
        break;
      }
      default:
        if (this.color) this.tagColor = getCSSColor(this.color);
    }
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
