import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { CpsAutocompleteComponent } from 'cps-ui-kit';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'child-cva-example',
  templateUrl: './child-cva-example.component.html',
  imports: [CommonModule, ReactiveFormsModule, CpsAutocompleteComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChildCvaExampleComponent),
      multi: true
    }
  ]
})
export class ChildCvaExampleComponent
  implements ControlValueAccessor, OnDestroy
{
  // For demonstration, we have a few “fake” options in the child
  // to show up in the dropdown.
  @Input() options: unknown[] = [];
  @Output() selectedOption = new EventEmitter();

  // The local form control storing the final “value”
  internalControl = new FormControl('');

  // True if we want to forcibly do something in (mousedown)
  toggled = false;

  private destroy$ = new Subject<void>();

  // Standard CVA callbacks
  private onChangeFn: (val: any) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor(private cdRef: ChangeDetectorRef) {
    // If needed, we can watch internalControl changes
    this.internalControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        debugger;

        // let the parent form know
        this.onChangeFn(value);
        this.selectedOption.emit(value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentOptionValue() {
    return this.options.find(
      (item) => (item as { name: string })?.name === this.internalControl.value
    );
  }

  // MOUSE DOWN that toggles some property (to simulate the typical
  // problem where the parent handles mousedown, possibly interfering
  // with child’s item clicks).
  onParentMousedown(event: MouseEvent) {
    // Toggling a property just to demonstrate the dropdown closing.
    this.toggled = !this.toggled;
    console.log(
      'child-cva-example → onParentMousedown fired! toggled=',
      this.toggled
    );
  }

  // Fired when user picks an item or finalizes a typed input in the cps-autocomplete
  onAutocompleteValueChanged(evt: any) {
    console.log('child-cva-example → onAutocompleteValueChanged:', evt);
    debugger;
    if (typeof evt === 'object' && evt?.name) {
      // a known object from the dropdown
      this.internalControl.setValue(evt.name);
    } else {
      // user typed a custom string
      this.internalControl.setValue(evt || '');
    }
    this.onTouchedFn();
  }

  writeValue(obj: any): void {
    console.log('child-cva-example → writeValue:', obj);
    if (obj !== undefined && obj !== null) {
      this.internalControl.setValue(obj, { emitEvent: false });
    } else {
      this.internalControl.reset('', { emitEvent: false });
    }
    // Force re-check
    this.cdRef.markForCheck();
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.internalControl.disable({ emitEvent: false });
    } else {
      this.internalControl.enable({ emitEvent: false });
    }
    this.cdRef.markForCheck();
  }
}
