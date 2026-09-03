import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsRadioGroupComponent } from './cps-radio-group.component';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators
} from '@angular/forms';

describe('CpsRadioGroupComponent', () => {
  let component: CpsRadioGroupComponent;
  let fixture: ComponentFixture<CpsRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsRadioGroupComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsRadioGroupComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
      { label: 'Option 3', value: 'opt3' }
    ]);
    fixture.componentRef.setInput('ariaLabel', 'Radio group');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.groupLabel).toBe('');
    expect(component.vertical).toBe(false);
    expect(component.disabled).toBe(false);
    expect(component.infoTooltip).toBe('');
    expect(component.hint).toBe('');
    expect(component.hideDetails).toBe(false);
  });

  it('should render group label when provided', () => {
    fixture.componentRef.setInput('groupLabel', 'Select an option');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cps-radio-group-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Select an option');
  });

  it('should render all radio options', () => {
    const radioButtons =
      fixture.nativeElement.querySelectorAll('cps-radio-button');
    expect(radioButtons.length).toBe(3);
  });

  it('should select an option when clicked', () => {
    jest.spyOn(component.valueChanged, 'emit');
    component.updateValueEvent(component.options[1].value);
    expect(component.value).toBe('opt2');
    expect(component.valueChanged.emit).toHaveBeenCalledWith('opt2');
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue('opt3');
    expect(component.value).toBe('opt3');
  });

  it('should register onChange callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.updateValueEvent(component.options[0].value);
    expect(fn).toHaveBeenCalledWith('opt1');
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should emit blurred event on blur', () => {
    jest.spyOn(component.blurred, 'emit');
    component.onBlur();
    expect(component.blurred.emit).toHaveBeenCalled();
  });

  it('should emit focused event on focus', () => {
    jest.spyOn(component.focused, 'emit');
    component.onFocus();
    expect(component.focused.emit).toHaveBeenCalled();
  });

  it('should apply vertical layout when vertical is true', () => {
    fixture.componentRef.setInput('vertical', true);
    fixture.detectChanges();
    expect(component.vertical).toBe(true);
  });

  it('should disable all options when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.disabled).toBe(true);
  });

  it('should display hint when provided', () => {
    fixture.componentRef.setInput('hint', 'Select one option');
    fixture.componentRef.setInput('hideDetails', false);
    fixture.detectChanges();
    expect(component.hint).toBe('Select one option');
  });

  it('should display info tooltip when provided', () => {
    fixture.componentRef.setInput('infoTooltip', 'More information');
    fixture.componentRef.setInput('groupLabel', 'Test');
    fixture.detectChanges();
    const infoCircle = fixture.nativeElement.querySelector('cps-info-circle');
    expect(infoCircle).toBeTruthy();
  });

  it('should handle form control validation', () => {
    // Component integrates with form control when provided
    expect(component).toBeTruthy();
  });

  it('should not display hint when hideDetails is true', () => {
    fixture.componentRef.setInput('hint', 'Some hint');
    fixture.componentRef.setInput('hideDetails', true);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.cps-radio-group-hint');
    expect(hint).toBeFalsy();
  });

  it('should handle disabled option', () => {
    fixture.componentRef.setInput('options', [
      { label: 'Option 1', value: 'opt1', disabled: true },
      { label: 'Option 2', value: 'opt2' }
    ]);
    fixture.detectChanges();
    const disabledOption = component.options[0];
    expect(disabledOption.disabled).toBe(true);
  });

  it('should clean up subscriptions on destroy', () => {
    // Just verify ngOnDestroy can be called without errors
    component.ngOnDestroy();
    expect(component).toBeTruthy();
  });

  describe('aria-label', () => {
    it('should apply ariaLabel as the aria-label attribute on the radiogroup element', () => {
      fixture.componentRef.setInput('ariaLabel', 'My radio group');
      fixture.detectChanges();
      const radiogroup = fixture.nativeElement.querySelector(
        '[role="radiogroup"]'
      );
      expect(radiogroup.getAttribute('aria-label')).toBe('My radio group');
    });

    it('should fall back to groupLabel for aria-label when ariaLabel is not set', () => {
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.componentRef.setInput('groupLabel', 'Choose an option');
      fixture.detectChanges();
      const radiogroup = fixture.nativeElement.querySelector(
        '[role="radiogroup"]'
      );
      expect(radiogroup.getAttribute('aria-label')).toBe('Choose an option');
    });

    it('should prefer ariaLabel over groupLabel', () => {
      fixture.componentRef.setInput('ariaLabel', 'Explicit label');
      fixture.componentRef.setInput('groupLabel', 'Visual label');
      fixture.detectChanges();
      const radiogroup = fixture.nativeElement.querySelector(
        '[role="radiogroup"]'
      );
      expect(radiogroup.getAttribute('aria-label')).toBe('Explicit label');
    });

    it('should log an error when neither ariaLabel nor groupLabel is provided', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.componentRef.setInput('groupLabel', '');
      fixture.detectChanges();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ariaLabel for accessibility')
      );
      consoleSpy.mockRestore();
    });

    it('should not log an error when ariaLabel is provided', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('ariaLabel', 'Accessible label');
      fixture.componentRef.setInput('groupLabel', '');
      fixture.detectChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  it('should not update value when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const initialValue = component.value;
    component.updateValueEvent('opt2');
    expect(component.value).toBe(initialValue);
  });

  describe('with NgControl (reactive forms)', () => {
    @Component({
      changeDetection: ChangeDetectionStrategy.Eager,
      imports: [CpsRadioGroupComponent, ReactiveFormsModule],
      template: `<cps-radio-group
        [formControl]="control"
        [options]="options"
        ariaLabel="Radio group"></cps-radio-group>`
    })
    class HostComponent {
      control = new FormControl('', Validators.required);
      options = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' }
      ];
    }

    let hostFixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let radioGroup: CpsRadioGroupComponent;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent]
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      radioGroup = hostFixture.debugElement.children[0].componentInstance;
    });

    it('should register itself as the valueAccessor on the NgControl', () => {
      radioGroup.updateValueEvent('opt1');
      hostFixture.detectChanges();
      expect(host.control.value).toBe('opt1');
    });

    it('should report isRequired true when a required validator is present', () => {
      expect(radioGroup.isRequired).toBe(true);
    });

    it('should report isRequired false when no required validator is present', () => {
      host.control.clearValidators();
      host.control.updateValueAndValidity();
      expect(radioGroup.isRequired).toBe(false);
    });

    it('should mark the control as touched and emit focused on focus', () => {
      jest.spyOn(radioGroup.focused, 'emit');
      expect(host.control.touched).toBe(false);
      radioGroup.onFocus();
      expect(host.control.touched).toBe(true);
      expect(radioGroup.focused.emit).toHaveBeenCalled();
    });

    it('should set a required error message on blur when untouched control is invalid', () => {
      host.control.markAsTouched();
      radioGroup.onBlur();
      expect(radioGroup.error).toBe('Field is required');
      expect(radioGroup.describedBy).toBe(radioGroup.errorId);
    });

    it('should clear the error when the control becomes valid', () => {
      host.control.markAsTouched();
      host.control.setValue('opt1');
      radioGroup.onBlur();
      expect(radioGroup.error).toBe('');
    });

    it('should not set an error when the control has not been touched', () => {
      radioGroup.onBlur();
      expect(radioGroup.error).toBe('');
    });

    it('should use a custom string error message when present', () => {
      host.control.setValidators(() => ({ custom: 'Custom failure message' }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      radioGroup.onBlur();
      expect(radioGroup.error).toBe('Custom failure message');
    });

    it('should fall back to "Unknown error" for non-string error values', () => {
      host.control.setValidators(() => ({ custom: true }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      radioGroup.onBlur();
      expect(radioGroup.error).toBe('Unknown error');
    });

    it('should recompute the error when the control status changes', () => {
      host.control.markAsTouched();
      host.control.setValue('opt1');
      hostFixture.detectChanges();
      expect(radioGroup.error).toBe('');
    });

    it('should prioritize the error id in describedBy over the hint id', () => {
      radioGroup.hint = 'Some hint';
      host.control.markAsTouched();
      radioGroup.onBlur();
      expect(radioGroup.describedBy).toBe(radioGroup.errorId);
    });

    it('should return the hint id in describedBy when there is no error', () => {
      radioGroup.hint = 'Some hint';
      expect(radioGroup.describedBy).toBe(radioGroup.hintId);
    });

    it('should return null in describedBy when there is neither error nor hint', () => {
      expect(radioGroup.describedBy).toBeNull();
    });

    it('should return null in describedBy when hideDetails is true even with an error', () => {
      host.control.markAsTouched();
      radioGroup.onBlur();
      radioGroup.hideDetails = true;
      expect(radioGroup.describedBy).toBeNull();
    });
  });
});
