import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, SimpleChange } from '@angular/core';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from './cps-button-toggle.component';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';

const mockFontSize = signal(16);

const mockRootFontSizeService = {
  fontSize: mockFontSize.asReadonly()
};

const OPTIONS: CpsButtonToggleOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' }
];

describe('CpsButtonToggleComponent', () => {
  let component: CpsButtonToggleComponent;
  let fixture: ComponentFixture<CpsButtonToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsButtonToggleComponent],
      providers: [
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsButtonToggleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Toggle group');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockFontSize.set(16);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have correct default input values', () => {
      const defaultComponent = TestBed.createComponent(
        CpsButtonToggleComponent
      ).componentInstance;
      expect(defaultComponent.label).toBe('');
      expect(defaultComponent.ariaLabel).toBe('');
      expect(defaultComponent.multiple).toBe(false);
      expect(defaultComponent.disabled).toBe(false);
      expect(defaultComponent.mandatory).toBe(true);
      expect(defaultComponent.radioNavigation).toBe(true);
      expect(defaultComponent.equalWidths).toBe(true);
      expect(defaultComponent.optionTooltipPosition).toBe('bottom');
      expect(defaultComponent.infoTooltip).toBe('');
      expect(defaultComponent.infoTooltipClass).toBe('cps-tooltip-content');
      expect(defaultComponent.infoTooltipMaxWidth).toBe('100%');
      expect(defaultComponent.infoTooltipPersistent).toBe(false);
      expect(defaultComponent.infoTooltipPosition).toBe('top');
      expect(defaultComponent.value).toBeUndefined();
    });
  });

  describe('template', () => {
    it('should render one button per option', () => {
      const options = fixture.nativeElement.querySelectorAll(
        '.cps-btn-toggle-content-option'
      );
      expect(options.length).toBe(OPTIONS.length);
    });

    it('should show label element when label is set', () => {
      fixture.componentRef.setInput('label', 'My Toggle');
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-label span'
      );
      expect(label?.textContent?.trim()).toBe('My Toggle');
    });

    it('should not show label element when label is empty', () => {
      const label = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-label'
      );
      expect(label).toBeNull();
    });

    it('should set aria-label on the container from ariaLabel', () => {
      fixture.componentRef.setInput('ariaLabel', 'Toggle group');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(group.getAttribute('aria-label')).toBe('Toggle group');
    });

    it('should prefer ariaLabel over label for container aria-label', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.componentRef.setInput('ariaLabel', 'Aria Label');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(group.getAttribute('aria-label')).toBe('Aria Label');
    });

    it('should fall back to label for container aria-label when ariaLabel is empty', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(group.getAttribute('aria-label')).toBe('My Label');
    });

    it('should mark selected option with checked input in radio mode', () => {
      fixture.componentRef.setInput('value', 'b');
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs[0].checked).toBe(false);
      expect(inputs[1].checked).toBe(true);
      expect(inputs[2].checked).toBe(false);
    });

    it('should disable all radio inputs when component is disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      inputs.forEach((input: HTMLInputElement) => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should disable only the matching radio input when option.disabled is true', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', label: 'Alpha', disabled: true },
        { value: 'b', label: 'Beta' }
      ]);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(false);
    });
  });

  describe('updateValueOnClick - single select', () => {
    it('should update value when clicking an option', () => {
      component.updateValueOnClick('b');
      expect(component.value).toBe('b');
    });

    it('should emit valueChanged when clicking an option', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.updateValueOnClick('a');
      expect(component.valueChanged.emit).toHaveBeenCalledWith('a');
    });

    it('should not change value when component is disabled', () => {
      fixture.componentRef.setInput('value', 'a');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.updateValueOnClick('b');
      expect(component.value).toBe('a');
    });

    it('should keep value when clicking same option and mandatory is true', () => {
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      component.updateValueOnClick('a');
      expect(component.value).toBe('a');
    });

    it('should deselect when clicking same option and mandatory is false', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      component.updateValueOnClick('a');
      expect(component.value).toBeUndefined();
    });

    it('should select a different option when mandatory is false', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      component.updateValueOnClick('b');
      expect(component.value).toBe('b');
    });
  });

  describe('updateValueOnClick - multiple select', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('multiple', true);
      fixture.detectChanges();
    });

    it('should add values to selection', () => {
      component.updateValueOnClick('a');
      component.updateValueOnClick('b');
      expect(component.value).toEqual(['a', 'b']);
    });

    it('should remove a value from selection', () => {
      fixture.componentRef.setInput('value', ['a', 'b']);
      fixture.detectChanges();
      component.updateValueOnClick('a');
      expect(component.value).toEqual(['b']);
    });

    it('should not remove last selected value when mandatory is true', () => {
      fixture.componentRef.setInput('value', ['a']);
      fixture.detectChanges();
      component.updateValueOnClick('a');
      expect(component.value).toEqual(['a']);
    });

    it('should remove last selected value when mandatory is false', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', ['a']);
      fixture.detectChanges();
      component.updateValueOnClick('a');
      expect(component.value).toEqual([]);
    });

    it('should preserve options order in selection', () => {
      component.updateValueOnClick('c');
      component.updateValueOnClick('a');
      expect(component.value).toEqual(['a', 'c']);
    });

    it('should emit valueChanged with array value', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.updateValueOnClick('b');
      expect(component.valueChanged.emit).toHaveBeenCalledWith(['b']);
    });

    it('should initialize value to [] when multiple is true and no value is set', () => {
      const newFixture = TestBed.createComponent(CpsButtonToggleComponent);
      newFixture.componentRef.setInput('ariaLabel', 'Toggle group');
      newFixture.componentRef.setInput('multiple', true);
      newFixture.componentRef.setInput('options', OPTIONS);
      newFixture.detectChanges();
      expect(newFixture.componentInstance.value).toEqual([]);
      newFixture.destroy();
    });
  });

  describe('ControlValueAccessor', () => {
    it('should call registered onChange when value changes', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.updateValueOnClick('b');
      expect(fn).toHaveBeenCalledWith('b');
    });

    it('should call registered onTouched', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      component.onTouched();
      expect(fn).toHaveBeenCalled();
    });

    it('should write value via writeValue', () => {
      component.writeValue('c');
      expect(component.value).toBe('c');
    });

    it('should not throw on setDisabledState', () => {
      expect(() => component.setDisabledState(true)).not.toThrow();
    });
  });

  describe('accessibility warnings', () => {
    it('should log error when neither label nor ariaLabel is provided on the component', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.ariaLabel = '';
      component.ngOnChanges({
        label: new SimpleChange('My Label', '', false),
        ariaLabel: new SimpleChange('Toggle group', '', false)
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ariaLabel')
      );
      consoleSpy.mockRestore();
    });

    it('should not log error when label is set', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.ariaLabel = '';
      fixture.componentRef.setInput('label', 'My Label');
      fixture.detectChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not log error when ariaLabel is set', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fixture.componentRef.setInput('ariaLabel', 'Accessible label');
      fixture.detectChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error when an option has no label and no ariaLabel', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const badOptions = [{ value: 'x' }];
      component.options = badOptions;
      component.ngOnChanges({
        options: new SimpleChange(OPTIONS, badOptions, false)
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ariaLabel')
      );
      consoleSpy.mockRestore();
    });

    it('should not log error when all options have labels', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = 'Toggle';
      const goodOptions = [{ value: 'x', label: 'X' }];
      component.options = goodOptions;
      component.ngOnChanges({
        options: new SimpleChange(OPTIONS, goodOptions, false)
      });
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not log error when options use ariaLabel instead of label', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = 'Toggle';
      const ariaOptions = [{ value: 'x', ariaLabel: 'X' }];
      component.options = ariaOptions;
      component.ngOnChanges({
        options: new SimpleChange(OPTIONS, ariaOptions, false)
      });
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('equal widths', () => {
    it('should not modify largestButtonWidthRem when equalWidths is false', () => {
      component.largestButtonWidthRem = 5;
      fixture.componentRef.setInput('equalWidths', false);
      (component as any)._setEqualWidths(16);
      expect(component.largestButtonWidthRem).toBe(5);
    });

    it('should set largestButtonWidthRem to padding baseline when all option labels have offsetWidth=0', () => {
      (component as any)._setEqualWidths(16);
      expect(component.largestButtonWidthRem).toBeCloseTo(1.625);
    });

    it('should add icon width and margin for options with both icon and label', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', icon: 'home', label: 'Home' }
      ]);
      (component as any)._setEqualWidths(16);
      expect(component.largestButtonWidthRem).toBeCloseTo(3.125);
    });

    it('should add icon width without margin for icon-only options', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', icon: 'home', ariaLabel: 'Home' }
      ]);
      (component as any)._setEqualWidths(16);
      expect(component.largestButtonWidthRem).toBeCloseTo(2.625);
    });

    it('should use the maximum width across all options', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', label: 'Alpha' },
        { value: 'b', icon: 'home', label: 'Beta' }
      ]);
      (component as any)._setEqualWidths(16);
      expect(component.largestButtonWidthRem).toBeCloseTo(3.125);
    });

    it('should recalculate equal widths when root font size signal changes', async () => {
      const spy = jest.spyOn(component as any, '_setEqualWidths');
      mockFontSize.set(20);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(spy).toHaveBeenCalledWith(20);
    });
  });

  describe('radio navigation', () => {
    it('should use role="radiogroup" by default for single-select', () => {
      const container = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(container.getAttribute('role')).toBe('radiogroup');
    });

    it('should use role="group" when radioNavigation is false', () => {
      fixture.componentRef.setInput('radioNavigation', false);
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(container.getAttribute('role')).toBe('group');
    });

    it('should use role="group" when multiple is true regardless of radioNavigation', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(container.getAttribute('role')).toBe('group');
    });

    it('should render native radio inputs in radio mode', () => {
      const inputs = fixture.nativeElement.querySelectorAll(
        'input[type="radio"].cps-btn-toggle-radio-input'
      );
      expect(inputs.length).toBe(OPTIONS.length);
    });

    it('should group radio inputs under a shared name', () => {
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      const names = Array.from(inputs).map((i: any) => i.name);
      expect(new Set(names).size).toBe(1);
      expect(names[0]).toBe(component.groupName);
    });

    it('should not render radio inputs when radioNavigation is false', () => {
      fixture.componentRef.setInput('radioNavigation', false);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs.length).toBe(0);
    });

    it('should not render radio inputs when mandatory is false', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs.length).toBe(0);
    });

    it('should use role="group" when mandatory is false', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(
        '.cps-btn-toggle-content'
      );
      expect(container.getAttribute('role')).toBe('group');
    });

    it('should not render radio inputs when multiple is true', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs.length).toBe(0);
    });

    it('should render buttons when radioNavigation is false', () => {
      fixture.componentRef.setInput('radioNavigation', false);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons.length).toBe(OPTIONS.length);
    });

    it('should mark disabled radio input when option.disabled is true', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', label: 'Alpha', disabled: true },
        { value: 'b', label: 'Beta' }
      ]);
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll(
        'input.cps-btn-toggle-radio-input'
      );
      expect(inputs[0].disabled).toBe(true);
      expect(inputs[1].disabled).toBe(false);
    });

    it('should add is-disabled class to label when component is disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const labels = fixture.nativeElement.querySelectorAll(
        'label.cps-btn-toggle-content-option'
      );
      labels.forEach((label: HTMLLabelElement) => {
        expect(label.classList.contains('is-disabled')).toBe(true);
      });
    });

    it('should use aria-pressed (not radio input) when radioNavigation is false', () => {
      fixture.componentRef.setInput('radioNavigation', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    });

    it('should use aria-pressed on buttons in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('value', ['a']);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    });

    it('should update value on onRadioChange', () => {
      component.onRadioChange('b');
      expect(component.value).toBe('b');
    });

    it('should emit valueChanged on onRadioChange', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.onRadioChange('c');
      expect(component.valueChanged.emit).toHaveBeenCalledWith('c');
    });

    it('should not update value on onRadioChange when disabled', () => {
      fixture.componentRef.setInput('value', 'a');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.onRadioChange('b');
      expect(component.value).toBe('a');
    });

    it('should deselect on onRadioClick when mandatory=false and same value', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      const event = new MouseEvent('click', { cancelable: true });
      component.onRadioClick(event, 'a');
      expect(component.value).toBeUndefined();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not deselect on onRadioClick when mandatory=true', () => {
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      const event = new MouseEvent('click', { cancelable: true });
      component.onRadioClick(event, 'a');
      expect(component.value).toBe('a');
      expect(event.defaultPrevented).toBe(false);
    });

    it('should not deselect on onRadioClick when component is disabled', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const event = new MouseEvent('click', { cancelable: true });
      component.onRadioClick(event, 'a');
      expect(component.value).toBe('a');
    });

    it('should not deselect on onRadioClick when a different option is clicked', () => {
      fixture.componentRef.setInput('mandatory', false);
      fixture.componentRef.setInput('value', 'a');
      fixture.detectChanges();
      const event = new MouseEvent('click', { cancelable: true });
      component.onRadioClick(event, 'b');
      expect(component.value).toBe('a');
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
