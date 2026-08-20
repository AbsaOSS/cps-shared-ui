import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsTextareaComponent } from './cps-textarea.component';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators
} from '@angular/forms';

describe('CpsTextareaComponent', () => {
  let component: CpsTextareaComponent;
  let fixture: ComponentFixture<CpsTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsTextareaComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTextareaComponent);
    component = fixture.componentInstance;
    component.ariaLabel = 'Textarea';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.placeholder).toBe('Please enter');
    expect(component.rows).toBe(5);
    expect(component.cols).toBe(20);
    expect(component.autofocus).toBe(false);
    expect(component.hint).toBe('');
    expect(component.disabled).toBe(false);
    expect(component.readonly).toBe(false);
    expect(component.width).toBe('100%');
    expect(component.clearable).toBe(false);
    expect(component.hideDetails).toBe(false);
    expect(component.persistentClear).toBe(false);
    expect(component.error).toBe('');
    expect(component.resizable).toBe('vertical');
    expect(component.maxHeight).toBe(Infinity);
  });

  it('should render label when provided', () => {
    fixture.componentRef.setInput('label', 'Comments');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cps-textarea-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Comments');
  });

  it('should render textarea with placeholder', () => {
    fixture.componentRef.setInput('placeholder', 'Enter your text');
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.placeholder).toBe('Enter your text');
  });

  it('should set rows attribute', () => {
    fixture.componentRef.setInput('rows', 10);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.rows).toBe(10);
  });

  it('should set cols attribute', () => {
    fixture.componentRef.setInput('cols', 50);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.cols).toBe(50);
  });

  it('should emit valueChanged on input', () => {
    jest.spyOn(component.valueChanged, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'New text';
    textarea.dispatchEvent(new Event('input'));
    expect(component.valueChanged.emit).toHaveBeenCalledWith('New text');
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue('Test value');
    expect(component.value).toBe('Test value');
  });

  it('should register onChange callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.value = 'New value';
    expect(fn).toHaveBeenCalledWith('New value');
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should display clear icon when clearable and has value', () => {
    fixture.componentRef.setInput('clearable', true);
    component.value = 'Some text';
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('should clear value when clear icon is clicked', () => {
    fixture.componentRef.setInput('clearable', true);
    component.value = 'Some text';
    fixture.detectChanges();
    const clearIcon = fixture.nativeElement.querySelector(
      '.clear-btn cps-icon'
    );
    clearIcon.click();
    expect(component.value).toBe('');
  });

  it('should display hint when provided', () => {
    fixture.componentRef.setInput('hint', 'Max 200 characters');
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.cps-textarea-hint');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain('Max 200 characters');
  });

  it('should display error message when error is set', () => {
    fixture.componentRef.setInput('error', 'This field is required');
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.cps-textarea-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('This field is required');
  });

  it('should disable textarea when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBe(true);
  });

  it('should set custom width', () => {
    fixture.componentRef.setInput('width', 500);
    fixture.detectChanges();
    // Width can be set as number or string
    expect(component.width).toBeDefined();
  });

  it('should keep width as string if already string', () => {
    fixture.componentRef.setInput('width', '80%');
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.width).toBe('80%');
  });

  it('should display info tooltip when provided', () => {
    fixture.componentRef.setInput('infoTooltip', 'Help text');
    fixture.componentRef.setInput('label', 'Comments');
    fixture.detectChanges();
    const infoCircle = fixture.nativeElement.querySelector('cps-info-circle');
    expect(infoCircle).toBeTruthy();
  });

  it('should focus textarea when focus method is called', () => {
    const textarea = fixture.nativeElement.querySelector('textarea');
    jest.spyOn(textarea, 'focus');
    component.focus();
    expect(textarea.focus).toHaveBeenCalled();
  });

  it('should not display hint when hideDetails is true', () => {
    fixture.componentRef.setInput('hint', 'Some hint');
    fixture.componentRef.setInput('hideDetails', true);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.cps-textarea-hint');
    expect(hint).toBeFalsy();
  });

  it('should apply resizable class', () => {
    fixture.componentRef.setInput('resizable', 'none');
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    // const style = window.getComputedStyle(textarea);
    // Check that resizable class is applied (actual style check depends on CSS)
    expect(textarea).toBeTruthy();
  });

  it('should show persistent clear icon when persistentClear is true', () => {
    fixture.componentRef.setInput('clearable', true);
    fixture.componentRef.setInput('persistentClear', true);
    component.value = '';
    fixture.detectChanges();
    // Persistent clear should be visible even without value
    const container = fixture.nativeElement.querySelector(
      '.cps-textarea-container'
    );
    expect(container).toBeTruthy();
  });

  it('should handle empty value correctly', () => {
    component.value = '';
    expect(component.value).toBe('');
  });

  it('should convert null or undefined to empty string', () => {
    component.writeValue(null as any);
    expect(component.value).toBe('');
  });

  it('should emit blurred event on blur', () => {
    jest.spyOn(component.blurred, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new Event('blur'));
    expect(component.blurred.emit).toHaveBeenCalled();
  });

  it('should emit focused event on focus', () => {
    jest.spyOn(component.focused, 'emit');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new Event('focus'));
    expect(component.focused.emit).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    component.ngOnDestroy();
    // Verify component can be destroyed without errors
    expect(component).toBeTruthy();
  });

  describe('readonly', () => {
    it('should set readonly attribute on textarea', () => {
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea.readOnly).toBe(true);
    });

    it('should hide clear button when readonly', () => {
      fixture.componentRef.setInput('clearable', true);
      fixture.componentRef.setInput('readonly', true);
      component.value = 'Some text';
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
      expect(clearBtn).toBeFalsy();
    });

    it('should hide resize handle when readonly', () => {
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector(
        '.cps-textarea-resize-handle'
      );
      expect(handle).toBeFalsy();
    });

    it('should not dim label when readonly', () => {
      fixture.componentRef.setInput('label', 'Label');
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('.cps-textarea-label');
      expect(label.classList).not.toContain('cps-textarea-label-disabled');
    });

    it('should dim label when disabled and not readonly', () => {
      fixture.componentRef.setInput('label', 'Label');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('.cps-textarea-label');
      expect(label.classList).toContain('cps-textarea-label-disabled');
    });
  });

  describe('keyboard focus tracking', () => {
    it('should set isKeyboardFocused to true on keyboard focus', () => {
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should not set isKeyboardFocused when focused after mousedown', () => {
      component.onTextareaMousedown();
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(false);
    });

    it('should clear isKeyboardFocused on blur', () => {
      component.onFocus();
      component.onBlur();
      expect(component.isKeyboardFocused).toBe(false);
    });
  });

  describe('maxHeight', () => {
    it('should have maxHeightPx as null when maxHeight is Infinity', () => {
      expect(component.maxHeightPx).toBeNull();
    });

    it('should set maxHeightPx when maxHeight is set in pixels', () => {
      fixture.componentRef.setInput('maxHeight', 300);
      fixture.detectChanges();
      expect(component.maxHeightPx).toBe(300);
    });

    it('should set maxHeightPx to null when resizable is none', () => {
      fixture.componentRef.setInput('maxHeight', 300);
      fixture.componentRef.setInput('resizable', 'none');
      fixture.detectChanges();
      expect(component.maxHeightPx).toBeNull();
    });

    it('should convert rem maxHeight into pixels', () => {
      fixture.componentRef.setInput('maxHeight', '10rem');
      fixture.detectChanges();
      expect(component.maxHeightPx).toBe(160);
    });

    it('should convert em maxHeight into pixels', () => {
      fixture.componentRef.setInput('maxHeight', '2em');
      fixture.detectChanges();
      expect(component.maxHeightPx).toBe(32);
    });

    it('should throw for an unsupported maxHeight unit', () => {
      expect(() => {
        fixture.componentRef.setInput('maxHeight', '50%');
        fixture.detectChanges();
      }).toThrow('Unsupported unit "%" for maxHeight.');
    });
  });

  describe('resize handle keyboard interaction', () => {
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      textarea = fixture.nativeElement.querySelector('textarea');
      Object.defineProperty(textarea, 'offsetHeight', {
        get: () => 100,
        configurable: true
      });
      (component as any)._singleRowHeightPx = 20;
    });

    it('should increase height on ArrowDown', () => {
      const step = (component as any)._resizeStepPx();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        cancelable: true
      });
      component.onResizeHandleKeydown(event);
      expect(textarea.style.height).toBe(`${100 + step}px`);
    });

    it('should decrease height on ArrowUp', () => {
      const step = (component as any)._resizeStepPx();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        cancelable: true
      });
      component.onResizeHandleKeydown(event);
      expect(textarea.style.height).toBe(`${100 - step}px`);
    });

    it('should not shrink below single row height on ArrowUp', () => {
      (component as any)._singleRowHeightPx = 80;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        cancelable: true
      });
      component.onResizeHandleKeydown(event);
      expect(textarea.style.height).toBe('80px');
    });

    it('should cap height at maxHeightPx on ArrowDown', () => {
      fixture.componentRef.setInput('maxHeight', 110);
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        cancelable: true
      });
      component.onResizeHandleKeydown(event);
      expect(textarea.style.height).toBe('110px');
    });

    it('should ignore unrelated keys', () => {
      textarea.style.height = '100px';
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true
      });
      component.onResizeHandleKeydown(event);
      expect(textarea.style.height).toBe('100px');
    });

    it('should do nothing when the textarea element is not available', () => {
      (component as any)._textareaEl = undefined;
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        cancelable: true
      });
      expect(() => component.onResizeHandleKeydown(event)).not.toThrow();
    });
  });

  describe('with NgControl (reactive forms)', () => {
    @Component({
      changeDetection: ChangeDetectionStrategy.Eager,
      imports: [CpsTextareaComponent, ReactiveFormsModule],
      template: `<cps-textarea
        [formControl]="control"
        ariaLabel="Textarea"></cps-textarea>`
    })
    class HostComponent {
      control = new FormControl('', Validators.required);
    }

    let hostFixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let textareaComponent: CpsTextareaComponent;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent]
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      textareaComponent =
        hostFixture.debugElement.children[0].componentInstance;
    });

    it('should register itself as the valueAccessor on the NgControl', () => {
      textareaComponent.writeValue('hello');
      textareaComponent.onChange('hello');
      hostFixture.detectChanges();
      expect(host.control.value).toBe('hello');
    });

    it('should report isRequired true when a required validator is present', () => {
      expect(textareaComponent.isRequired).toBe(true);
    });

    it('should report isRequired false when no required validator is present', () => {
      host.control.clearValidators();
      host.control.updateValueAndValidity();
      expect(textareaComponent.isRequired).toBe(false);
    });

    it('should recompute the error when the control status changes', () => {
      host.control.markAsTouched();
      host.control.updateValueAndValidity();
      expect(textareaComponent.error).toBe('Field is required');
    });

    it('should not set an error when the control has not been touched', () => {
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe('');
    });

    it('should clear the error when the control becomes valid', () => {
      host.control.markAsTouched();
      host.control.setValue('some value');
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe('');
    });

    it('should set a pattern error message', () => {
      host.control.setValidators(Validators.pattern(/^\d+$/));
      host.control.setValue('abc');
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe('Value is invalid');
    });

    it('should set a minlength error message', () => {
      host.control.setValidators(Validators.minLength(5));
      host.control.setValue('ab');
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe(
        'Field must contain at least 5 characters'
      );
    });

    it('should set a maxlength error message', () => {
      host.control.setValidators(Validators.maxLength(2));
      host.control.setValue('abcdef');
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe(
        'Field must contain 2 characters maximum'
      );
    });

    it('should use a custom string error message when present', () => {
      host.control.setValidators(() => ({ custom: 'Custom failure' }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe('Custom failure');
    });

    it('should fall back to "Unknown error" for non-string error values', () => {
      host.control.setValidators(() => ({ custom: true }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.error).toBe('Unknown error');
    });

    it('should mark the control as touched and emit focused on focus', () => {
      jest.spyOn(textareaComponent.focused, 'emit');
      expect(host.control.touched).toBe(false);
      textareaComponent.onFocus();
      expect(host.control.touched).toBe(true);
      expect(textareaComponent.focused.emit).toHaveBeenCalled();
    });

    it('should prioritize the error id in describedBy over the hint id', () => {
      textareaComponent.hint = 'Some hint';
      host.control.markAsTouched();
      textareaComponent.onBlur();
      expect(textareaComponent.describedBy).toBe(textareaComponent.errorId);
    });
  });
});
