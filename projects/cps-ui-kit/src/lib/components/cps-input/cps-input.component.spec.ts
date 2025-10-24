import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsInputComponent } from './cps-input.component';

describe('CpsInputComponent', () => {
  let component: CpsInputComponent;
  let fixture: ComponentFixture<CpsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsInputComponent, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Value Handling', () => {
    it('should handle empty string', () => {
      component.writeValue('');
      fixture.detectChanges();

      expect(component.value).toBe('');
    });

    it('should handle text values', () => {
      component.writeValue('Hello');
      fixture.detectChanges();

      expect(component.value).toBe('Hello');
    });

    it('should handle numeric values', () => {
      component.writeValue('123');
      fixture.detectChanges();

      expect(component.value).toBe('123');
    });

    it('should handle negative numbers', () => {
      component.writeValue('-5');
      fixture.detectChanges();

      expect(component.value).toBe('-5');
    });

    it('should handle decimal numbers', () => {
      component.writeValue('3.14');
      fixture.detectChanges();

      expect(component.value).toBe('3.14');
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    it('should register onChange callback', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);

      component.updateValueEvent({ target: { value: 'test' } } as any);

      expect(fn).toHaveBeenCalledWith('test');
    });

    it('should call onChange when value updates', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const inputElement = fixture.nativeElement.querySelector('input');
      inputElement.value = 'new value';
      inputElement.dispatchEvent(new Event('input'));

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('should write value through writeValue', () => {
      component.writeValue('test value');
      fixture.detectChanges();

      expect(component.value).toBe('test value');
      const inputElement = fixture.nativeElement.querySelector('input');
      expect(inputElement.value).toBe('test value');
    });
  });

  describe('Input Properties', () => {
    it('should apply label', () => {
      component.label = 'Test Label';
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('label');
      expect(label?.textContent?.trim()).toBe('Test Label');
    });

    it('should apply placeholder', () => {
      component.placeholder = 'Enter text';
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.placeholder).toBe('Enter text');
    });

    it('should disable input when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBe(true);
    });

    it('should make input readonly when readonly is true', () => {
      component.readonly = true;
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.readOnly).toBe(true);
    });

    it('should apply hint text', () => {
      component.hint = 'Helper text';
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector('.cps-input-hint');
      expect(hint?.textContent?.trim()).toBe('Helper text');
    });

    it('should change input type', () => {
      component.type = 'password';
      component.ngOnInit();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.type).toBe('password');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear value when clear button is clicked', () => {
      component.clearable = true;
      component.writeValue('test');
      fixture.detectChanges();

      component.onClear();

      expect(component.value).toBe('');
    });

    it('should emit cleared event', () => {
      const emitSpy = jest.spyOn(component.cleared, 'emit');
      component.clearable = true;
      component.writeValue('test');

      component.onClear();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit valueChanged event when clearing', () => {
      const emitSpy = jest.spyOn(component.valueChanged, 'emit');
      component.writeValue('test');

      component.clear();

      expect(emitSpy).toHaveBeenCalledWith('');
    });

    it('should not clear if value is already empty', () => {
      const emitSpy = jest.spyOn(component.valueChanged, 'emit');
      component.writeValue('');

      component.clear();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Password Toggle', () => {
    it('should toggle between password and text type', () => {
      component.type = 'password';
      component.ngOnInit();
      expect(component.currentType).toBe('password');

      component.togglePassword();
      expect(component.currentType).toBe('text');

      component.togglePassword();
      expect(component.currentType).toBe('password');
    });
  });

  describe('Event Emissions', () => {
    it('should emit focused event on focus', () => {
      const emitSpy = jest.spyOn(component.focused, 'emit');

      component.onFocus();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit blurred event on blur', () => {
      const emitSpy = jest.spyOn(component.blurred, 'emit');

      component.onBlur();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit enterClicked event on enter key', () => {
      const emitSpy = jest.spyOn(component.enterClicked, 'emit');

      component.onInputEnterKeyDown();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit valueChanged on input', () => {
      const emitSpy = jest.spyOn(component.valueChanged, 'emit');

      const event = { target: { value: 'new value' } };
      component.updateValueEvent(event as any);

      expect(emitSpy).toHaveBeenCalledWith('new value');
    });

    it('should emit prefixIconClicked when prefix icon is clicked', () => {
      const emitSpy = jest.spyOn(component.prefixIconClicked, 'emit');
      component.prefixIconClickable = true;

      component.onClickPrefixIcon();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit prefixIconClicked when not clickable', () => {
      const emitSpy = jest.spyOn(component.prefixIconClicked, 'emit');
      component.prefixIconClickable = false;

      component.onClickPrefixIcon();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit prefixIconClicked when disabled', () => {
      const emitSpy = jest.spyOn(component.prefixIconClicked, 'emit');
      component.prefixIconClickable = true;
      component.disabled = true;

      component.onClickPrefixIcon();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit prefixIconClicked when readonly', () => {
      const emitSpy = jest.spyOn(component.prefixIconClicked, 'emit');
      component.prefixIconClickable = true;
      component.readonly = true;

      component.onClickPrefixIcon();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Validation Error Handling', () => {
    it('should display required error message', () => {
      // Mock NgControl with errors
      (component as any)._control = {
        errors: { required: true },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Field is required');
    });

    it('should display pattern error message', () => {
      (component as any)._control = {
        errors: { pattern: true },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Value is invalid');
    });

    it('should display email error message', () => {
      (component as any)._control = {
        errors: { email: true },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Email format is invalid');
    });

    it('should display minlength error message', () => {
      (component as any)._control = {
        errors: { minlength: { requiredLength: 8 } },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Field must contain at least 8 characters');
    });

    it('should display maxlength error message', () => {
      (component as any)._control = {
        errors: { maxlength: { requiredLength: 10 } },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Field must contain 10 characters maximum');
    });

    it('should clear error when control is not touched', () => {
      (component as any)._control = {
        errors: { required: true },
        control: { touched: false }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('');
    });

    it('should clear error when no errors exist', () => {
      (component as any)._control = {
        errors: null,
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('');
    });

    it('should handle custom error messages', () => {
      (component as any)._control = {
        errors: { customError: 'Custom error message' },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Custom error message');
    });

    it('should display unknown error for unhandled errors', () => {
      (component as any)._control = {
        errors: { unknownError: { someProperty: 'value' } },
        control: { touched: true }
      };

      (component as any)._checkErrors();

      expect(component.error).toBe('Unknown error');
    });
  });

  describe('Focus Management', () => {
    it('should focus input programmatically', () => {
      const input = fixture.nativeElement.querySelector('input');
      const focusSpy = jest.spyOn(input, 'focus');

      component.focus();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should blur input on enter key', () => {
      const input = fixture.nativeElement.querySelector('input');
      const blurSpy = jest.spyOn(input, 'blur');

      component.onInputEnterKeyDown();

      expect(blurSpy).toHaveBeenCalled();
    });

    it('should mark control as touched on focus', () => {
      const markTouchedSpy = jest.fn();
      (component as any)._control = {
        control: { markAsTouched: markTouchedSpy }
      };

      component.onFocus();

      expect(markTouchedSpy).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize currentType from type input', () => {
      component.type = 'password';
      component.ngOnInit();

      expect(component.currentType).toBe('password');
    });

    it('should subscribe to control status changes', () => {
      const mockSubscription = { unsubscribe: jest.fn() };
      const mockStatusChanges = {
        subscribe: jest.fn().mockReturnValue(mockSubscription)
      };

      (component as any)._control = {
        statusChanges: mockStatusChanges
      };

      component.ngOnInit();

      expect(mockStatusChanges.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      const unsubscribeSpy = jest.fn();
      (component as any)._statusChangesSubscription = {
        unsubscribe: unsubscribeSpy
      };

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should calculate prefix width after view init', () => {
      component.prefixText = 'USD';
      component.prefixIcon = 'search';

      // Mock prefixTextSpan
      component.prefixTextSpan = {
        nativeElement: { offsetWidth: 50 }
      } as ElementRef;

      component.ngAfterViewInit();

      expect(component.prefixWidth).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid value changes', () => {
      const values = ['0', '1', '2', '3', '4', '5'];

      values.forEach((val) => {
        component.writeValue(val);
        fixture.detectChanges();
        expect(component.value).toBe(val);
      });
    });

    it('should handle very large numbers', () => {
      const largeNumber = '999999999999';
      component.writeValue(largeNumber);
      fixture.detectChanges();

      expect(component.value).toBe(largeNumber);
    });

    it('should handle special characters in text', () => {
      const specialText = '!@#$%^&*()';
      component.writeValue(specialText);
      fixture.detectChanges();

      expect(component.value).toBe(specialText);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界';
      component.writeValue(unicode);
      fixture.detectChanges();

      expect(component.value).toBe(unicode);
    });

    it('should handle whitespace', () => {
      const whitespace = '   spaces   ';
      component.writeValue(whitespace);
      fixture.detectChanges();

      expect(component.value).toBe(whitespace);
    });
  });

  describe('Type Consistency', () => {
    it('should maintain number type for numeric input', () => {
      component.type = 'number';
      component.writeValue('42');
      fixture.detectChanges();

      expect(typeof component.value).toBe('string');
      expect(component.value).toBe('42');
    });

    it('should maintain string type for text input', () => {
      component.type = 'text';
      component.writeValue('text');
      fixture.detectChanges();

      expect(typeof component.value).toBe('string');
      expect(component.value).toBe('text');
    });
  });
});
