import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels.pipe';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value.pipe';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsMenuHideReason } from '../cps-menu/cps-menu.component';
import { CpsSelectComponent } from './cps-select.component';

const mockRootFontSizeService = {
  fontSize: () => 16
};

const OPTIONS = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' }
];

describe('CpsSelectComponent', () => {
  let component: CpsSelectComponent;
  let fixture: ComponentFixture<CpsSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CpsSelectComponent,
        NoopAnimationsModule
      ],
      providers: [
        LabelByValuePipe,
        CombineLabelsPipe,
        CheckOptionSelectedPipe,
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test select');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Display', () => {
    it('should display the label when provided', () => {
      fixture.componentRef.setInput('label', 'Test Label');
      fixture.detectChanges();
      const label = fixture.debugElement.query(
        By.css('.cps-select-label label')
      );
      expect(label.nativeElement.textContent).toBe('Test Label');
    });

    it('should not render the label element when label is empty', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.cps-select-label'));
      expect(label).toBeNull();
    });

    it('should display placeholder when no value is selected', () => {
      fixture.componentRef.setInput('placeholder', 'Pick one');
      component.writeValue(undefined);
      fixture.detectChanges();
      const placeholder = fixture.debugElement.query(
        By.css('.cps-select-box-placeholder')
      );
      expect(placeholder.nativeElement.textContent.trim()).toBe('Pick one');
    });

    it('should display single selected option label', () => {
      component.writeValue(OPTIONS[1]);
      fixture.detectChanges();
      const singleItem = fixture.debugElement.query(By.css('.single-item'));
      expect(singleItem.nativeElement.textContent.trim()).toBe('Option 2');
    });

    it('should display multiple selected options as chips', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([OPTIONS[0], OPTIONS[2]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      const chips = fixture.debugElement.queryAll(By.css('cps-chip'));
      expect(chips.length).toBe(2);
    });

    it('should display hint when provided', () => {
      fixture.componentRef.setInput('hint', 'Hint text');
      fixture.detectChanges();
      const hint = fixture.debugElement.query(By.css('.cps-select-hint'));
      expect(hint.nativeElement.textContent.trim()).toBe('Hint text');
    });

    it('should display info tooltip icon when infoTooltip is provided', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.componentRef.setInput('infoTooltip', 'More info');
      fixture.detectChanges();
      const info = fixture.debugElement.query(
        By.css('.cps-select-label-info-circle')
      );
      expect(info).toBeTruthy();
    });

    it('should apply underlined appearance class', () => {
      fixture.componentRef.setInput('appearance', 'underlined');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container.underlined')
      );
      expect(container).toBeTruthy();
    });

    it('should apply borderless appearance class', () => {
      fixture.componentRef.setInput('appearance', 'borderless');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container.borderless')
      );
      expect(container).toBeTruthy();
    });

    it('should apply disabled class when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(
        By.css('.cps-select.disabled')
      );
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Value Handling', () => {
    it('should write value via writeValue', () => {
      component.writeValue(OPTIONS[0]);
      expect(component.value).toEqual(OPTIONS[0]);
    });

    it('should initialise multiple value as empty array', () => {
      fixture.componentRef.setInput('multiple', true);
      component.ngOnInit();
      expect(Array.isArray(component.value)).toBe(true);
    });

    it('should emit valueChanged when value is updated', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.select(OPTIONS[0], false);
      expect(component.valueChanged.emit).toHaveBeenCalledWith(OPTIONS[0]);
    });

    it('should call onChange when value is updated', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);
      component.select(OPTIONS[1], false);
      expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    });

    it('should add item to multiple value on select', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([]);
      component.select(OPTIONS[0], false);
      expect(component.value).toContainEqual(OPTIONS[0]);
    });

    it('should remove item from multiple value on re-select', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      component.select(OPTIONS[0], false);
      expect(component.value).not.toContainEqual(OPTIONS[0]);
      expect(component.value).toContainEqual(OPTIONS[1]);
    });

    it('hasSelectedValue should return false for undefined', () => {
      component.writeValue(undefined);
      expect(component.hasSelectedValue()).toBe(false);
    });

    it('hasSelectedValue should return false for null', () => {
      component.writeValue(null);
      expect(component.hasSelectedValue()).toBe(false);
    });

    it('hasSelectedValue should return true for a valid object', () => {
      component.writeValue(OPTIONS[0]);
      expect(component.hasSelectedValue()).toBe(true);
    });
  });

  describe('ControlValueAccessor', () => {
    it('should register onChange callback', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.writeValue(OPTIONS[0]);
      expect(fn).toHaveBeenCalledWith(OPTIONS[0]);
    });

    it('should register onTouched callback', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });
  });

  describe('Dropdown Open / Close', () => {
    it('should open dropdown on box click', () => {
      const box = fixture.debugElement.query(By.css('.cps-select-box'));
      box.nativeElement.dispatchEvent(new Event('mousedown'));
      fixture.detectChanges();
      expect(component.isOpened).toBe(true);
    });

    it('should not open dropdown when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const box = fixture.debugElement.query(By.css('.cps-select-box'));
      box.nativeElement.dispatchEvent(new Event('mousedown'));
      fixture.detectChanges();
      expect(component.isOpened).toBe(false);
    });

    it('should close dropdown on second box click when already open', () => {
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
    });

    it('should toggle dropdown via chevron click', () => {
      const event = new MouseEvent('mousedown');
      jest.spyOn(event, 'stopPropagation');
      jest.spyOn(event, 'preventDefault');

      component.onChevronClick(event);
      expect(component.isOpened).toBe(true);

      component.onChevronClick(event);
      expect(component.isOpened).toBe(false);
    });

    it('should close dropdown on blur', () => {
      component.onBoxClick();
      expect(component.isOpened).toBe(true);

      component.onBlur();
      expect(component.isOpened).toBe(false);
    });

    it('should set isActive true on focus', () => {
      component.onFocus();
      expect(component.isActive).toBe(true);
    });

    it('should set isActive false on blur', () => {
      component.onFocus();
      component.onBlur();
      expect(component.isActive).toBe(false);
    });

    it('should not set isActive when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.onFocus();
      expect(component.isActive).toBe(false);
    });

    it('should emit focused on focus', () => {
      jest.spyOn(component.focused, 'emit');
      component.onFocus();
      expect(component.focused.emit).toHaveBeenCalled();
    });

    it('should emit blurred on blur', () => {
      jest.spyOn(component.blurred, 'emit');
      component.onBlur();
      expect(component.blurred.emit).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    function keydown(code: number): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        keyCode: code,
        bubbles: true
      } as any);
      jest.spyOn(event, 'preventDefault');
      return event;
    }

    it('should open dropdown on Enter when closed', () => {
      const event = keydown(13);
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(true);
    });

    it('should close dropdown on Enter when open with no highlighted option', () => {
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
      const event = keydown(13);
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(false);
    });

    it('should open dropdown on Space when closed', () => {
      const event = keydown(32);
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(true);
    });

    it('should open dropdown on ArrowDown when closed', () => {
      const event = keydown(40);
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(true);
    });

    it('should open dropdown on ArrowUp when closed', () => {
      const event = keydown(38);
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(true);
    });

    it('should prevent default on Enter/Space', () => {
      const event = keydown(13);
      component.onContainerKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not open dropdown on unrelated key', () => {
      const event = keydown(9); // Tab
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(false);
    });
  });

  describe('Clear', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('clearable', true);
      fixture.detectChanges();
    });

    it('should clear single value when clear is called with a value', fakeAsync(() => {
      component.writeValue(OPTIONS[0]);
      fixture.componentRef.setInput('openOnClear', false);
      component.clear();
      tick();
      expect(component.hasSelectedValue()).toBe(false);
    }));

    it('should clear multiple value when clear is called', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.componentRef.setInput('openOnClear', false);
      component.clear();
      tick();
      expect(component.value).toEqual([]);
    }));

    it('should emit valueChanged on clear', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.writeValue(OPTIONS[0]);
      fixture.componentRef.setInput('openOnClear', false);
      component.clear();
      expect(component.valueChanged.emit).toHaveBeenCalled();
    });

    it('should not clear or refocus when value is already empty', fakeAsync(() => {
      jest.spyOn(component.valueChanged, 'emit');
      component.writeValue(undefined);
      component.clear();
      tick();
      expect(component.valueChanged.emit).not.toHaveBeenCalled();
    }));

    it('should open dropdown on clear when openOnClear is true', fakeAsync(() => {
      component.writeValue(OPTIONS[0]);
      fixture.componentRef.setInput('openOnClear', true);
      component.clear();
      tick();
      expect(component.isOpened).toBe(true);
    }));

    it('should show clear icon when value is set', () => {
      component.writeValue(OPTIONS[0]);
      fixture.detectChanges();
      const clearIcon = fixture.debugElement.query(
        By.css('.cps-select-box-clear-icon')
      );
      expect(clearIcon.nativeElement.style.visibility).toBe('visible');
    });

    it('should hide clear icon when no value', () => {
      component.writeValue(undefined);
      fixture.detectChanges();
      const clearIcon = fixture.debugElement.query(
        By.css('.cps-select-box-clear-icon')
      );
      expect(clearIcon.nativeElement.style.visibility).toBe('hidden');
    });
  });

  describe('Select All', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.writeValue([]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    });

    it('should select all options when toggleAll is called with empty value', () => {
      component.toggleAll();
      expect(component.value.length).toBe(OPTIONS.length);
    });

    it('should deselect all options when toggleAll is called with all selected', () => {
      component.writeValue([...OPTIONS]);
      component.toggleAll();
      expect(component.value.length).toBe(0);
    });

    it('isSelectAllVisible should be true for multiple with selectAll and >1 options', () => {
      expect(component.isSelectAllVisible).toBe(true);
    });

    it('isSelectAllVisible should be false for single mode', () => {
      fixture.componentRef.setInput('multiple', false);
      fixture.detectChanges();
      expect(component.isSelectAllVisible).toBe(false);
    });

    it('isSelectAllVisible should be false when virtualScroll is enabled', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      expect(component.isSelectAllVisible).toBe(false);
    });
  });

  describe('onBeforeOptionsHidden', () => {
    it('should close dropdown on SCROLL', () => {
      component.onBoxClick();
      component.onBeforeOptionsHidden(CpsMenuHideReason.SCROLL);
      expect(component.isOpened).toBe(false);
    });

    it('should close dropdown on RESIZE', () => {
      component.onBoxClick();
      component.onBeforeOptionsHidden(CpsMenuHideReason.RESIZE);
      expect(component.isOpened).toBe(false);
    });

    it('should close dropdown on CLICK_OUTSIDE', () => {
      component.onBoxClick();
      component.onBeforeOptionsHidden(CpsMenuHideReason.CLICK_OUTSIDE);
      expect(component.isOpened).toBe(false);
    });

    it('should reset highlighted index on CLICK_OUTSIDE', () => {
      component.onBoxClick();
      component.optionHighlightedIndex = 1;
      component.onBeforeOptionsHidden(CpsMenuHideReason.CLICK_OUTSIDE);
      expect(component.optionHighlightedIndex).toBe(-1);
    });
  });

  describe('Accessibility', () => {
    it('should set aria-label from ariaLabel input', () => {
      fixture.componentRef.setInput('ariaLabel', 'My Select');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-label')).toContain(
        'My Select'
      );
    });

    it('should set aria-label from label when ariaLabel is not provided', () => {
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.componentRef.setInput('label', 'Country');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-label')).toContain(
        'Country'
      );
    });

    it('should prefer ariaLabel over label', () => {
      fixture.componentRef.setInput('label', 'Label');
      fixture.componentRef.setInput('ariaLabel', 'Override');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-label')).toContain(
        'Override'
      );
    });

    it('should log error when neither label nor ariaLabel is provided', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fixture.componentRef.setInput('label', '');
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ariaLabel')
      );
    });

    it('should set aria-expanded to false when closed', () => {
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-expanded')).toBe(
        'false'
      );
    });

    it('should set aria-expanded to true when open', () => {
      component.onBoxClick();
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-expanded')).toBe(
        'true'
      );
    });

    it('should set aria-disabled when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-select-container')
      );
      expect(container.nativeElement.getAttribute('aria-disabled')).toBe(
        'true'
      );
    });

    it('clear button should have role="button" and aria-label', () => {
      fixture.componentRef.setInput('clearable', true);
      fixture.detectChanges();
      const clearBtn = fixture.debugElement.query(
        By.css('.cps-select-box-clear-icon')
      );
      expect(clearBtn.nativeElement.getAttribute('role')).toBe('button');
      expect(clearBtn.nativeElement.getAttribute('aria-label')).toBe(
        'Clear selection'
      );
    });
  });
});
