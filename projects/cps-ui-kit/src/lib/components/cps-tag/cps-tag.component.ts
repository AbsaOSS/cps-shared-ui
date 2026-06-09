import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  OnChanges,
  Optional,
  Output,
  Self,
  type SimpleChanges
} from '@angular/core';
import { getCSSColor } from '../../utils/colors-utils';
import { ControlValueAccessor, NgControl } from '@angular/forms';

/**
 * CpsTagComponent is used to categorize content.
 * @group Components
 */
@Component({
  imports: [CommonModule],
  selector: 'cps-tag',
  templateUrl: './cps-tag.component.html',
  styleUrls: ['./cps-tag.component.scss']
})
export class CpsTagComponent
  implements ControlValueAccessor, OnInit, OnChanges
{
  /**
   * Label of the tag.
   * @group Props
   */
  @Input() label = '';

  /**
   * Color of the tag.
   * @group Props
   */
  @Input() color = 'calm';

  /**
   * Determines whether the tag should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether the tag should be selectable.
   * @group Props
   */
  @Input() selectable = false;

  /**
   * Tag value.
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
   * @param {boolean} boolean - value change.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<boolean>();

  classesList: string[] = [];
  pressing = false;
  cvtColor = '';

  private _value = false;

  constructor(
    @Self() @Optional() private _control: NgControl,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.cvtColor = getCSSColor(this.color, this.document);
    this.setClasses();
    this._logMissingLabelError();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.color) {
      this.cvtColor = getCSSColor(this.color, this.document);
    }
    if (changes.selectable || changes.disabled) {
      this.setClasses();
    }

    this._logMissingLabelError();
  }

  setClasses(): void {
    const classes = ['cps-tag'];
    if (this.selectable) {
      classes.push('cps-tag--selectable');
    }
    if (this.disabled) {
      classes.push('cps-tag--disabled');
    }
    this.classesList = classes;
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

  handleEnterKeydown(event: Event) {
    if ((event as KeyboardEvent).repeat) return;
    event.preventDefault();
    this.toggleSelected();
  }

  handleSpaceKeydown(event: Event) {
    event.preventDefault();
    this.pressing = true;
  }

  toggleSelected() {
    this.pressing = false;
    if (this.disabled || !this.selectable) return;
    this._updateValue(!this.value);
  }

  private _updateValue(value: boolean) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _logMissingLabelError() {
    if (!this.label?.trim()) {
      console.error('CpsTagComponent: the tag must have a label.');
    }
  }
}
