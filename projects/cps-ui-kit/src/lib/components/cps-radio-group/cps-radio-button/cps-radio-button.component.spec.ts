import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsRadioButtonComponent } from './cps-radio-button.component';

describe('CpsRadioButtonComponent', () => {
  let component: CpsRadioButtonComponent;
  let fixture: ComponentFixture<CpsRadioButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsRadioButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsRadioButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('option', { label: 'Option A', value: 'a' });
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create with default input values', () => {
    expect(component).toBeTruthy();
    expect(component.groupName).toBe('');
    expect(component.checked).toBe(false);
    expect(component.groupDisabled).toBe(false);
  });

  it('should generate a non-empty, prefixed inputId', () => {
    expect(component.inputId).toMatch(/^cps-radio-button-input-/);
  });

  describe('ngOnChanges accessibility guard', () => {
    it('should log console.error when option has neither label nor ariaLabel', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      fixture.componentRef.setInput('option', { value: 'b' });
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith(
        'CpsRadioButtonComponent: unlabeled radio button component must have an ariaLabel for accessibility.'
      );
    });

    it('should log console.error when option label and ariaLabel are blank', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      fixture.componentRef.setInput('option', {
        value: 'b',
        label: '  ',
        ariaLabel: '  '
      });
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log console.error when option.label is set', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      fixture.componentRef.setInput('option', { value: 'b', label: 'B' });
      fixture.detectChanges();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log console.error when option.ariaLabel is set', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      fixture.componentRef.setInput('option', {
        value: 'b',
        ariaLabel: 'Option B'
      });
      fixture.detectChanges();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not re-log when a change other than option fires', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateValue', () => {
    it('should call preventDefault on the event', () => {
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.updateValue(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not emit updateValueEvent when option is disabled', () => {
      fixture.componentRef.setInput('option', {
        label: 'A',
        value: 'a',
        disabled: true
      });
      fixture.detectChanges();
      const spy = jest.spyOn(component.updateValueEvent, 'emit');

      component.updateValue({ preventDefault: jest.fn() } as unknown as Event);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should emit updateValueEvent with the option's value when not disabled", () => {
      const spy = jest.spyOn(component.updateValueEvent, 'emit');

      component.updateValue({ preventDefault: jest.fn() } as unknown as Event);

      expect(spy).toHaveBeenCalledWith('a');
    });
  });

  it('should emit blurred on onBlur', () => {
    const spy = jest.spyOn(component.blurred, 'emit');
    component.onBlur();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit focused on onFocus', () => {
    const spy = jest.spyOn(component.focused, 'emit');
    component.onFocus();
    expect(spy).toHaveBeenCalled();
  });

  it('should invoke updateValue end-to-end when the rendered input changes', () => {
    const spy = jest.spyOn(component.updateValueEvent, 'emit');
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[type="radio"]'
    );

    input.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith('a');
  });
});
