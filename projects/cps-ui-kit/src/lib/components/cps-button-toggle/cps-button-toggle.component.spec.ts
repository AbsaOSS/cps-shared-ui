import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from './cps-button-toggle.component';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';

const mockRootFontSizeService = {
  fontSize: () => 16
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
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have correct default input values', () => {
      expect(component.label).toBe('');
      expect(component.ariaLabel).toBe('');
      expect(component.multiple).toBe(false);
      expect(component.disabled).toBe(false);
      expect(component.mandatory).toBe(true);
      expect(component.equalWidths).toBe(true);
      expect(component.optionTooltipPosition).toBe('bottom');
      expect(component.infoTooltip).toBe('');
      expect(component.infoTooltipClass).toBe('cps-tooltip-content');
      expect(component.infoTooltipMaxWidth).toBe('100%');
      expect(component.infoTooltipPersistent).toBe(false);
      expect(component.infoTooltipPosition).toBe('top');
      expect(component.value).toBeUndefined();
    });
  });

  describe('template', () => {
    it('should render one button per option', () => {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons.length).toBe(OPTIONS.length);
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

    it('should set aria-label on role=group from ariaLabel', () => {
      fixture.componentRef.setInput('ariaLabel', 'Toggle group');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('[role="group"]');
      expect(group.getAttribute('aria-label')).toBe('Toggle group');
    });

    it('should prefer ariaLabel over label for role=group aria-label', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.componentRef.setInput('ariaLabel', 'Aria Label');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('[role="group"]');
      expect(group.getAttribute('aria-label')).toBe('Aria Label');
    });

    it('should fall back to label for role=group aria-label when ariaLabel is empty', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('[role="group"]');
      expect(group.getAttribute('aria-label')).toBe('My Label');
    });

    it('should mark selected option with aria-pressed="true"', () => {
      fixture.componentRef.setInput('value', 'b');
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
      expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
      expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
    });

    it('should disable all buttons when component is disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      buttons.forEach((btn: HTMLButtonElement) => {
        expect(btn.disabled).toBe(true);
      });
    });

    it('should disable only the matching button when option.disabled is true', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', label: 'Alpha', disabled: true },
        { value: 'b', label: 'Beta' }
      ]);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      expect(buttons[0].disabled).toBe(true);
      expect(buttons[1].disabled).toBe(false);
    });
  });

  describe('updateValueOnClick - single select', () => {
    it('should update value when clicking an option', () => {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      buttons[1].click();
      expect(component.value).toBe('b');
    });

    it('should emit valueChanged when clicking an option', () => {
      jest.spyOn(component.valueChanged, 'emit');
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cps-btn-toggle-content-option'
      );
      buttons[0].click();
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
      component.ngOnChanges({
        label: new SimpleChange('My Label', '', false),
        ariaLabel: new SimpleChange('', '', false)
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
      (component as any)._setEqualWidths();
      expect(component.largestButtonWidthRem).toBe(5);
    });

    it('should set largestButtonWidthRem to padding baseline when all option labels have offsetWidth=0', () => {
      (component as any)._setEqualWidths();
      expect(component.largestButtonWidthRem).toBeCloseTo(1.625);
    });

    it('should add icon width and margin for options with both icon and label', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', icon: 'home', label: 'Home' }
      ]);
      (component as any)._setEqualWidths();
      expect(component.largestButtonWidthRem).toBeCloseTo(3.125);
    });

    it('should add icon width without margin for icon-only options', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', icon: 'home', ariaLabel: 'Home' }
      ]);
      (component as any)._setEqualWidths();
      expect(component.largestButtonWidthRem).toBeCloseTo(2.625);
    });

    it('should use the maximum width across all options', () => {
      fixture.componentRef.setInput('options', [
        { value: 'a', label: 'Alpha' },
        { value: 'b', icon: 'home', label: 'Beta' }
      ]);
      (component as any)._setEqualWidths();
      expect(component.largestButtonWidthRem).toBeCloseTo(3.125);
    });
  });
});
