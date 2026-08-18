import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick
} from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected/check-option-selected.pipe';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels/combine-labels.pipe';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value/label-by-value.pipe';
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

  describe('Scroll alignment', () => {
    let scrollIntoView: jest.Mock;

    beforeEach(() => {
      scrollIntoView = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    });

    it('should scroll the selected option into view with inline: start when the dropdown opens', fakeAsync(() => {
      component.writeValue(OPTIONS[0]);
      fixture.detectChanges();

      component.onBoxClick();
      fixture.detectChanges();
      tick();

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'instant',
        block: 'nearest',
        inline: 'start'
      });
    }));

    it('should highlight an out-of-view option with inline: nearest so horizontal scroll position is preserved', () => {
      const parent = document.createElement('div');
      jest
        .spyOn(parent, 'getBoundingClientRect')
        .mockReturnValue({ top: 0, bottom: 200 } as DOMRect);

      const el = document.createElement('div');
      parent.appendChild(el);
      jest
        .spyOn(el, 'getBoundingClientRect')
        .mockReturnValue({ top: -10, bottom: 20 } as DOMRect);

      (component as any)._highlightOption(el);

      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest'
      });
    });

    it('should not scroll an already fully visible highlighted option', () => {
      const parent = document.createElement('div');
      jest
        .spyOn(parent, 'getBoundingClientRect')
        .mockReturnValue({ top: 0, bottom: 200 } as DOMRect);

      const el = document.createElement('div');
      parent.appendChild(el);
      jest
        .spyOn(el, 'getBoundingClientRect')
        .mockReturnValue({ top: 10, bottom: 40 } as DOMRect);

      (component as any)._highlightOption(el);

      expect(scrollIntoView).not.toHaveBeenCalled();
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

  describe('Chip Removal', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    });

    it('should prevent default on chip close button mousedown so the box does not lose focus', () => {
      const closeBtn = fixture.debugElement.query(
        By.css('.cps-chip-close-btn')
      );
      const event = new MouseEvent('mousedown', { cancelable: true });
      closeBtn.nativeElement.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should keep the dropdown open and remove the value when a chip close button is clicked', () => {
      component.onBoxClick();
      fixture.detectChanges();
      expect(component.isOpened).toBe(true);

      const closeBtn = fixture.debugElement.query(
        By.css('.cps-chip-close-btn')
      );
      closeBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.isOpened).toBe(true);
      expect(component.value).not.toContainEqual(OPTIONS[0]);
      expect(component.value).toContainEqual(OPTIONS[1]);
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

  describe('ngOnChanges width', () => {
    it('should recompute cvtWidth when width changes', () => {
      fixture.componentRef.setInput('width', 250);
      fixture.detectChanges();
      expect(component.cvtWidth).toBe('250px');
    });
  });

  describe('select with keepInitialOrder', () => {
    it('should keep the original option order when adding a selection', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('keepInitialOrder', true);
      component.value = [component.options[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      component.select(component.options[0], false);

      expect(component.value).toEqual([
        component.options[0],
        component.options[2]
      ]);
    });

    it('should keep the original option order when deselecting', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('keepInitialOrder', true);
      component.value = [component.options[0], component.options[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      component.select(component.options[0], false);

      expect(component.value).toEqual([component.options[2]]);
    });
  });

  describe('toggleAll with returnObject false', () => {
    it('should select values instead of full option objects', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      component.toggleAll();

      expect(component.value).toEqual(['opt1', 'opt2', 'opt3']);
    });
  });

  describe('onContainerKeyDown', () => {
    it('should open the menu on Enter when closed', () => {
      component.isOpened = false;
      jest.spyOn(component as any, '_toggleOptions');
      component.onContainerKeyDown({ keyCode: 13, preventDefault: jest.fn() });
      expect((component as any)._toggleOptions).toHaveBeenCalledWith(true);
    });

    it('should close the menu on Enter when nothing is highlighted', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = -1;
      jest.spyOn(component as any, '_toggleOptions');
      component.onContainerKeyDown({ keyCode: 13, preventDefault: jest.fn() });
      expect((component as any)._toggleOptions).toHaveBeenCalledWith(false);
    });

    it('should toggle all when Enter is pressed on the select-all option', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      component.isOpened = true;
      component.optionHighlightedIndex = 0;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      jest.spyOn(component, 'toggleAll');

      component.onContainerKeyDown({ keyCode: 13, preventDefault: jest.fn() });

      expect(component.toggleAll).toHaveBeenCalled();
    });

    it('should select the option at the adjusted index when select-all is visible', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      component.isOpened = true;
      component.optionHighlightedIndex = 1;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      jest.spyOn(component, 'select');

      component.onContainerKeyDown({ keyCode: 13, preventDefault: jest.fn() });

      expect(component.select).toHaveBeenCalledWith(
        component.options[0],
        false
      );
    });

    it('should open the menu on ArrowDown when closed', () => {
      component.isOpened = false;
      jest.spyOn(component as any, '_toggleOptions');
      component.onContainerKeyDown({ keyCode: 40, preventDefault: jest.fn() });
      expect((component as any)._toggleOptions).toHaveBeenCalledWith(true);
    });

    it('should call virtual navigation when virtualScroll is enabled', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      component.isOpened = true;
      fixture.detectChanges();
      jest.spyOn(component as any, '_navigateVirtualOptionsByArrows');

      component.onContainerKeyDown({ keyCode: 40, preventDefault: jest.fn() });

      expect(
        (component as any)._navigateVirtualOptionsByArrows
      ).toHaveBeenCalledWith(false);
    });

    it('should navigate options by arrows when not virtual scrolled', () => {
      component.isOpened = true;
      jest.spyOn(component as any, '_navigateOptionsByArrows');

      component.onContainerKeyDown({ keyCode: 38, preventDefault: jest.fn() });

      expect((component as any)._navigateOptionsByArrows).toHaveBeenCalledWith(
        true
      );
    });
  });

  describe('_navigateOptionsByArrows', () => {
    it('should do nothing when the menu is closed', () => {
      component.isOpened = false;
      (component as any)._navigateOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(-1);
    });

    it('should do nothing when there are no options', () => {
      fixture.componentRef.setInput('options', []);
      component.isOpened = true;
      fixture.detectChanges();
      (component as any)._navigateOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(-1);
    });

    it('should navigate forward and highlight the option element', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = -1;
      fixture.detectChanges();
      const optionsListEl = component.optionsList.nativeElement;
      const optionId = component.getOptionId(component.options[0], 0);
      const el = document.createElement('div');
      el.id = optionId;
      const parent = document.createElement('div');
      parent.appendChild(el);
      optionsListEl.appendChild(parent);

      (component as any)._navigateOptionsByArrows(false);

      expect(component.optionHighlightedIndex).toBe(0);
      expect(component.isArrowNavigating).toBe(true);
    });

    it('should stop when the highlighted option id cannot be resolved', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = 99;
      expect(() =>
        (component as any)._navigateOptionsByArrows(false)
      ).not.toThrow();
    });
  });

  describe('_scrollVirtualListToIndex', () => {
    it('should scroll via virtualList.scrollToIndex when no scroller element exists', () => {
      (component as any).optionsList = {
        nativeElement: document.createElement('div')
      };
      const scrollToIndex = jest.fn();
      (component as any).virtualList = { scrollToIndex };
      (component as any)._scrollVirtualListToIndex(1);
      expect(scrollToIndex).toHaveBeenCalledWith(1);
    });
  });

  describe('_navigateVirtualOptionsByArrows', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
    });

    it('should not navigate when the menu is closed', () => {
      component.isOpened = false;
      (component as any)._navigateVirtualOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(-1);
    });

    it('should navigate forward through virtual options', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = -1;
      (component as any)._navigateVirtualOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(0);
    });
  });

  describe('activeDescendantId', () => {
    it('should return the select-all id when highlighted', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.isOpened = true;
      component.optionHighlightedIndex = 0;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(component.activeDescendantId).toBe(component.selectAllOptionId);
    });

    it('should return null when the highlighted option no longer exists', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = 99;
      fixture.detectChanges();
      expect(component.activeDescendantId).toBeNull();
    });
  });

  describe('with NgControl (reactive forms)', () => {
    @Component({
      imports: [CpsSelectComponent, ReactiveFormsModule],
      template: `<cps-select
        [formControl]="control"
        [options]="options"
        ariaLabel="Select"></cps-select>`
    })
    class HostComponent {
      control = new FormControl(undefined, Validators.required);
      options = OPTIONS;
    }

    let hostFixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let select: CpsSelectComponent;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent],
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

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      select = hostFixture.debugElement.children[0].componentInstance;
    });

    it('should register itself as the valueAccessor on the NgControl', () => {
      select.select(select.options[0], false);
      hostFixture.detectChanges();
      expect(host.control.value).toEqual(select.options[0]);
    });

    it('should report isRequired true when a required validator is present', () => {
      expect(select.isRequired).toBe(true);
    });

    it('should report isRequired false when no required validator is present', () => {
      host.control.clearValidators();
      host.control.updateValueAndValidity();
      expect(select.isRequired).toBe(false);
    });

    it('should set a required error message when touched and invalid', () => {
      host.control.markAsTouched();
      host.control.updateValueAndValidity();
      expect(select.error).toBe('Field is required');
    });

    it('should not set an error when the control has not been touched', () => {
      select.onBlur();
      expect(select.error).toBe('');
    });

    it('should clear the error when the control becomes valid', () => {
      host.control.markAsTouched();
      host.control.setValue(select.options[0]);
      select.onBlur();
      expect(select.error).toBe('');
    });

    it('should use a custom string error message when present', () => {
      host.control.setValidators(() => ({ custom: 'Custom failure' }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      select.onBlur();
      expect(select.error).toBe('Custom failure');
    });

    it('should fall back to "Unknown error" for non-string error values', () => {
      host.control.setValidators(() => ({ custom: true }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      select.onBlur();
      expect(select.error).toBe('Unknown error');
    });

    it('should mark the control as touched and emit focused on focus', () => {
      jest.spyOn(select.focused, 'emit');
      expect(host.control.touched).toBe(false);
      select.onFocus();
      expect(host.control.touched).toBe(true);
      expect(select.focused.emit).toHaveBeenCalled();
    });

    it('should prioritize the error id in describedBy over the hint id', () => {
      select.hint = 'Some hint';
      host.control.markAsTouched();
      select.onBlur();
      expect(select.describedBy).toBe(select.errorId);
    });
  });

  describe('onBeforeOptionsHidden with SCROLL/RESIZE', () => {
    it('should toggle options closed without dehighlighting on SCROLL', () => {
      component.isOpened = true;
      fixture.detectChanges();
      jest.spyOn(component as any, '_dehighlightOption');

      component.onBeforeOptionsHidden(CpsMenuHideReason.SCROLL);

      expect((component as any)._dehighlightOption).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('should focus the container and open the menu', () => {
      const focusSpy = jest.spyOn(
        component.selectContainer.nativeElement,
        'focus'
      );
      component.focus();
      expect(focusSpy).toHaveBeenCalled();
      expect(component.isOpened).toBe(true);
    });
  });

  describe('clear', () => {
    it('should refocus the container after clearing', fakeAsync(() => {
      component.value = component.options[0];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      const focusSpy = jest.spyOn(
        component.selectContainer.nativeElement,
        'focus'
      );

      component.clear();
      tick();

      expect(focusSpy).toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('onOptionClick / _clickOption', () => {
    it('should select the option and close the menu in single-select mode', fakeAsync(() => {
      component.onBoxClick();
      tick();
      fixture.detectChanges();
      expect(component.isOpened).toBe(true);

      component.onOptionClick(component.options[1]);
      tick();

      expect(component.value).toEqual(component.options[1]);
      expect(component.isOpened).toBe(false);
      discardPeriodicTasks();
    }));

    it('should keep the menu open in multiple-select mode', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.value = [];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.onBoxClick();
      tick();

      component.onOptionClick(component.options[0]);
      tick();

      expect(component.isOpened).toBe(true);
      discardPeriodicTasks();
    }));
  });

  describe('_checkErrors edge cases', () => {
    it('should clear the error when the errors object has no keys', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: {}
      };
      component.error = 'stale error';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });
  });

  describe('_toggleOptions toggle without explicit show', () => {
    it('should call optionsMenu.toggle when show is omitted', () => {
      const toggleSpy = jest.spyOn(component.optionsMenu, 'toggle');
      (component as any)._toggleOptions();
      expect(toggleSpy).toHaveBeenCalledWith({
        target: component.selectBox.nativeElement
      });
    });
  });

  describe('recalcVirtualListHeight with virtualScroll enabled', () => {
    it('should recompute virtualListHeightRem from the options length', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      component.recalcVirtualListHeight();
      expect(component.virtualListHeightRem).toBeGreaterThan(0);
    });
  });

  describe('_toggleOptions setTimeout scroll behavior', () => {
    it('should scroll the virtual list to the highlighted index when there is no selected element', fakeAsync(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      component.optionHighlightedIndex = 1;
      const scrollSpy = jest
        .spyOn(component as any, '_scrollVirtualListToIndex')
        .mockImplementation(() => {});

      (component as any)._toggleOptions(true);
      tick();

      expect(scrollSpy).toHaveBeenCalledWith(1);
      discardPeriodicTasks();
    }));
  });

  describe('_scrollVirtualListToIndex with a real scroller element', () => {
    it('should scroll up when the item starts above the viewport', () => {
      const scroller = document.createElement('div');
      scroller.className = 'p-virtualscroller';
      scroller.scrollTop = 500;
      Object.defineProperty(scroller, 'clientHeight', {
        value: 100,
        configurable: true
      });
      Object.defineProperty(scroller, 'scrollHeight', {
        value: 2000,
        configurable: true
      });
      const optionsListEl = document.createElement('div');
      optionsListEl.appendChild(scroller);
      (component as any).optionsList = { nativeElement: optionsListEl };

      (component as any)._scrollVirtualListToIndex(0);

      expect(scroller.scrollTop).toBe(0);
    });
  });

  describe('resizeObserver callback', () => {
    let capturedCallback: ((entries: any[]) => void) | undefined;
    let localFixture: ComponentFixture<CpsSelectComponent>;
    let localComponent: CpsSelectComponent;
    let OriginalRO: any;

    beforeEach(async () => {
      capturedCallback = undefined;
      OriginalRO = window.ResizeObserver;
      (window as any).ResizeObserver = class {
        constructor(cb: (entries: any[]) => void) {
          // The select component's own constructor runs first (before any
          // child component, e.g. cps-menu, also creates a ResizeObserver),
          // so keep only the first callback captured.
          if (!capturedCallback) capturedCallback = cb;
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      };

      await TestBed.resetTestingModule();
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
      localFixture = TestBed.createComponent(CpsSelectComponent);
      localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('ariaLabel', 'Test select');
      localFixture.componentRef.setInput('options', OPTIONS);
      localFixture.detectChanges();
    });

    afterEach(() => {
      window.ResizeObserver = OriginalRO;
    });

    it('should update selectBoxWidthPx from the observed entry target', () => {
      const target = document.createElement('div');
      Object.defineProperty(target, 'offsetWidth', {
        value: 240,
        configurable: true
      });
      capturedCallback?.([{ target }]);
      expect(localComponent.selectBoxWidthPx).toBe(240);
    });

    it('should ignore entries without a target', () => {
      const before = localComponent.selectBoxWidthPx;
      expect(() => capturedCallback?.([{}])).not.toThrow();
      expect(localComponent.selectBoxWidthPx).toBe(before);
    });
  });

  describe('select with returnObject false', () => {
    it('should use the option value in single-select mode', () => {
      fixture.componentRef.setInput('returnObject', false);
      fixture.detectChanges();
      component.select(component.options[1], false);
      expect(component.value).toBe('opt2');
    });

    it('should use option values when adding without keepInitialOrder', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      component.value = [];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.select(component.options[0], false);
      expect(component.value).toEqual(['opt1']);
    });

    it('should use option values when adding with keepInitialOrder', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('keepInitialOrder', true);
      component.value = ['opt3'];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.select(component.options[0], false);
      expect(component.value).toEqual(['opt1', 'opt3']);
    });
  });

  describe('getOptionId', () => {
    it('should use the id cached from the option set at its original index, ignoring a later index argument', () => {
      const option = component.options[0];
      const idAtOriginalIndex = component.getOptionId(option, 0);
      const idWithDifferentIndexArg = component.getOptionId(option, 5);
      expect(idWithDifferentIndexArg).toBe(idAtOriginalIndex);
      expect(idWithDifferentIndexArg).not.toContain('-5');
    });

    it('should build a fresh id for a non-object option', () => {
      const id = component.getOptionId('opt1' as any, 0);
      expect(id).toContain('-0');
    });
  });

  describe('ngOnChanges options with a non-object entry', () => {
    it('should not throw and should skip caching a primitive option', () => {
      expect(() => {
        fixture.componentRef.setInput('options', ['opt1', 'opt2']);
        fixture.detectChanges();
      }).not.toThrow();

      const idAtIndex0 = component.getOptionId('opt1', 0);
      const idAtIndex3 = component.getOptionId('opt1', 3);
      expect(idAtIndex3).not.toBe(idAtIndex0);
      expect(idAtIndex3).toContain('-3');
    });
  });

  describe('_syncHighlightToValue', () => {
    it('should highlight based on the first selected value in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', false);
      component.value = [component.options[1]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      (component as any)._syncHighlightToValue();
      expect(component.optionHighlightedIndex).toBe(1);
    });

    it('should leave the highlighted index untouched when the value is not among the options', () => {
      component.optionHighlightedIndex = -1;
      component.value = { label: 'Missing', value: 'missing' };
      (component as any)._syncHighlightToValue();
      expect(component.optionHighlightedIndex).toBe(-1);
    });
  });

  describe('onContainerKeyDown Enter with select-all visible but not highlighted', () => {
    it('should decrement the index and click the adjusted option', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      component.isOpened = true;
      component.optionHighlightedIndex = 2;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      jest.spyOn(component as any, '_clickOption');

      component.onContainerKeyDown({ keyCode: 13, preventDefault: jest.fn() });

      expect((component as any)._clickOption).toHaveBeenCalledWith(
        component.options[1]
      );
    });
  });

  describe('hasSelectedValue with a string value', () => {
    it('should return false for a blank string', () => {
      component.value = '   ';
      expect(component.hasSelectedValue()).toBe(false);
    });

    it('should return true for a non-blank string', () => {
      component.value = 'something';
      expect(component.hasSelectedValue()).toBe(true);
    });
  });

  describe('_navigateVirtualOptionsByArrows with no options', () => {
    it('should do nothing when there are no options', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.componentRef.setInput('options', []);
      component.isOpened = true;
      fixture.detectChanges();
      expect(() =>
        (component as any)._navigateVirtualOptionsByArrows(false)
      ).not.toThrow();
      expect(component.optionHighlightedIndex).toBe(-1);
    });
  });

  describe('_nextHighlightIndex upward wrap', () => {
    it('should wrap to the last index when moving up from the first item', () => {
      component.optionHighlightedIndex = 0;
      const result = (component as any)._nextHighlightIndex(true, 3);
      expect(result).toBe(2);
    });

    it('should move to the previous index when not at the start', () => {
      component.optionHighlightedIndex = 2;
      const result = (component as any)._nextHighlightIndex(true, 3);
      expect(result).toBe(1);
    });
  });

  describe('_scrollVirtualListToIndex scrolling down', () => {
    it('should scroll down when the item ends below the viewport', () => {
      const scroller = document.createElement('div');
      scroller.className = 'p-virtualscroller';
      scroller.scrollTop = 0;
      Object.defineProperty(scroller, 'clientHeight', {
        value: 50,
        configurable: true
      });
      Object.defineProperty(scroller, 'scrollHeight', {
        value: 2000,
        configurable: true
      });
      const optionsListEl = document.createElement('div');
      optionsListEl.appendChild(scroller);
      (component as any).optionsList = { nativeElement: optionsListEl };

      (component as any)._scrollVirtualListToIndex(10);

      expect(scroller.scrollTop).toBeGreaterThan(0);
    });
  });

  describe('track expression / NG0956 regression', () => {
    function chipLabels(): string[] {
      return fixture.debugElement
        .queryAll(By.css('[data-testid="cps-chip-label"]'))
        .map((el) => el.nativeElement.textContent.trim());
    }

    it('should not warn when options are replaced with new-but-value-equal objects (mirrors cps-paginator._syncRows)', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([OPTIONS[0], OPTIONS[2]]);
      (component as any)._toggleOptions(true);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const NEW_OPTIONS = OPTIONS.map((o) => ({ ...o }));
      fixture.componentRef.setInput('options', NEW_OPTIONS);
      component.writeValue([NEW_OPTIONS[0], NEW_OPTIONS[2]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      expect(chipLabels()).toEqual(['Option 1', 'Option 3']);
      const optionLabels = fixture.debugElement
        .queryAll(By.css('[data-testid="cps-select-option-label"]'))
        .map((el) => el.nativeElement.textContent.trim());
      expect(optionLabels).toEqual(['Option 1', 'Option 2', 'Option 3']);
      warnSpy.mockRestore();
    });

    it('should track numeric option values correctly across option-object re-renders (returnObject: false)', () => {
      const NUMERIC_OPTIONS = [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Three', value: 3 }
      ];
      fixture.componentRef.setInput('options', NUMERIC_OPTIONS);
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([1, 3]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fixture.componentRef.setInput(
        'options',
        NUMERIC_OPTIONS.map((o) => ({ ...o }))
      );
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      warnSpy.mockRestore();

      expect(chipLabels()).toEqual(['One', 'Three']);
    });

    it('should treat falsy-but-valid option[optionValue] fields (0, "", false) as distinct keys, not fall back to object identity', () => {
      const FALSY_OPTIONS = [
        { label: 'Zero', value: 0 },
        { label: 'Empty', value: '' },
        { label: 'False', value: false }
      ];
      fixture.componentRef.setInput('options', FALSY_OPTIONS);
      fixture.componentRef.setInput('returnObject', true);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([FALSY_OPTIONS[0], FALSY_OPTIONS[2]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const NEW_FALSY = FALSY_OPTIONS.map((o) => ({ ...o }));
      fixture.componentRef.setInput('options', NEW_FALSY);
      component.writeValue([NEW_FALSY[0], NEW_FALSY[2]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      warnSpy.mockRestore();

      expect(chipLabels()).toEqual(['Zero', 'False']);
    });

    it('should not throw when the multi-select value array contains null/undefined elements (returnObject: false)', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      fixture.componentRef.setInput('returnObject', false);
      expect(() => {
        component.writeValue(['opt1', null, undefined, 'opt3']);
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should render chips correctly for primitive (non-object) options in multi-select', () => {
      fixture.componentRef.setInput('options', ['opt1', 'opt2', 'opt3']);
      fixture.componentRef.setInput('returnObject', true);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      component.writeValue(['opt1', 'opt3']);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      warnSpy.mockRestore();

      const chips = fixture.debugElement.queryAll(By.css('cps-chip'));
      expect(chips.length).toBe(2);
    });

    it('should track nested-object optionValue values by stable reference without warning', () => {
      const CITY_OPTIONS = [
        { name: 'New York', data: { code: 'NY' } },
        { name: 'Cape Town', data: { code: 'CPT' } },
        { name: 'Los Angeles', data: { code: 'LA' } }
      ];
      fixture.componentRef.setInput('options', CITY_OPTIONS);
      fixture.componentRef.setInput('optionLabel', 'name');
      fixture.componentRef.setInput('optionValue', 'data');
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([CITY_OPTIONS[0].data, CITY_OPTIONS[2].data]);
      fixture.changeDetectorRef.markForCheck();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fixture.detectChanges();
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      warnSpy.mockRestore();

      const chips = fixture.debugElement.queryAll(By.css('cps-chip'));
      expect(chips.length).toBe(2);
    });

    it('returnObject=false with an object-valued optionValue field is not identity-churn-safe if options are replaced', () => {
      const CITY_OPTIONS = [
        { name: 'New York', data: { code: 'NY' } },
        { name: 'Cape Town', data: { code: 'CPT' } },
        { name: 'Los Angeles', data: { code: 'LA' } }
      ];
      fixture.componentRef.setInput('options', CITY_OPTIONS);
      fixture.componentRef.setInput('optionLabel', 'name');
      fixture.componentRef.setInput('optionValue', 'data');
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([CITY_OPTIONS[0].data, CITY_OPTIONS[2].data]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(() => {
        const NEW_CITY_OPTIONS = CITY_OPTIONS.map((o) => ({
          ...o,
          data: { ...o.data }
        }));
        fixture.componentRef.setInput('options', NEW_CITY_OPTIONS);
        component.writeValue([
          NEW_CITY_OPTIONS[0].data,
          NEW_CITY_OPTIONS[2].data
        ]);
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();

      const chips = fixture.debugElement.queryAll(By.css('cps-chip'));
      expect(chips.length).toBe(2);
    });

    it('should not throw when two options share the same optionValue (pre-existing unsupported configuration)', () => {
      const DUPLICATE_OPTIONS = [
        { label: 'First', value: 'dup' },
        { label: 'Second', value: 'dup' }
      ];
      fixture.componentRef.setInput('options', DUPLICATE_OPTIONS);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => {
        component.writeValue([...DUPLICATE_OPTIONS]);
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NG0955'));
      warnSpy.mockRestore();
    });

    it('an option whose optionValue field is null/undefined falls back to whole-object identity tracking', () => {
      const OPTIONS_WITH_MISSING_VALUE = [
        { label: 'Has value', value: 'opt1' },
        { label: 'Missing value' }
      ];
      fixture.componentRef.setInput('options', OPTIONS_WITH_MISSING_VALUE);
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
      component.writeValue([...OPTIONS_WITH_MISSING_VALUE]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(() => {
        const NEW_OPTIONS = OPTIONS_WITH_MISSING_VALUE.map((o) => ({ ...o }));
        fixture.componentRef.setInput('options', NEW_OPTIONS);
        component.writeValue([...NEW_OPTIONS]);
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();

      expect(chipLabels()).toEqual(['Has value', 'Missing value']);
    });
  });
});
