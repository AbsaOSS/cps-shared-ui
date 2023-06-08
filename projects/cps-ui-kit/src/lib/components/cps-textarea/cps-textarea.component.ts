import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'cps-textarea',
  imports: [CommonModule, CpsIconComponent],
  templateUrl: './cps-textarea.component.html',
  styleUrls: ['./cps-textarea.component.scss']
})
export class CpsTextareaComponent implements OnInit, OnDestroy {
  @Input() label = '';
  @Input() autocapitalize: 'none' | 'sentences' | 'words' | 'characters' =
    'none';

  @Input() placeholder = 'Please enter your text';
  @Input() rows = 5;
  @Input() cols = 20;
  @Input() autocomplete: 'on' | 'off' = 'off';
  @Input() autofocus = false;
  @Input() readonly = false;
  @Input() spellcheck: boolean | 'default' = 'default';
  @Input() wrap: 'hard' | 'soft' | 'off' = 'soft';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() clearable = false;
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() error = '';
  @Input() set value(value: string) {
    this._value = value;
    this.onChange(value);
  }

  get value(): string {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<string>();
  @Output() focused = new EventEmitter();
  @Output() prefixIconClicked = new EventEmitter();
  @Output() blurred = new EventEmitter();

  private _statusChangesSubscription: Subscription = new Subscription();
  private _value = '';

  cvtWidth = '';

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.cvtWidth = convertSize(this.width);

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  onChange = (event: any) => {};

  private _checkErrors() {
    if (!this._control) return;
    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this.error = '';
      return;
    }

    if ('required' in errors) {
      this.error = 'Field is required';
      return;
    }

    if ('minlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain at least ${errors['minlength'].requiredLength} characters`;
      return;
    }

    if ('maxlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain ${errors['maxlength'].requiredLength} characters maximum`;
      return;
    }

    const errArr = Object.values(errors);
    if (errArr.length < 1) {
      this.error = '';
      return;
    }
    const message = errArr.find((msg) => typeof msg === 'string');

    this.error = message || 'Unknown error';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  writeValue(value: string) {
    this.value = value;
  }

  updateValueEvent(event: any) {
    const value = event?.target?.value || '';
    this._updateValue(value);
  }

  private _updateValue(value: string) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear() {
    if (this.value !== '') this._updateValue('');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this.focused.emit();
  }

  focus() {
    this._elementRef?.nativeElement?.querySelector('textarea')?.focus();
  }
}
