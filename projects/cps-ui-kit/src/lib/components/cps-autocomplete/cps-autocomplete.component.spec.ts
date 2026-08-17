import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
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
import { LabelByValuePipe } from '../../pipes/internal/label-by-value/label-by-value.pipe';
import { CpsMenuHideReason } from '../cps-menu/cps-menu.component';
import { CpsAutocompleteComponent } from './cps-autocomplete.component';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';

const mockFontSize = signal(16);
const mockRootFontSizeService = {
  fontSize: mockFontSize.asReadonly()
};

describe('CpsAutocompleteComponent', () => {
  let component: CpsAutocompleteComponent;
  let fixture: ComponentFixture<CpsAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CpsAutocompleteComponent,
        NoopAnimationsModule
      ],
      providers: [
        LabelByValuePipe,
        CheckOptionSelectedPipe,
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements and attributes
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test autocomplete');
    fixture.componentRef.setInput('options', [
      { label: 'Option 1', value: 'opt1', info: 'Info 1' },
      { label: 'Option 2', value: 'opt2', info: 'Info 2' },
      { label: 'Option 3', value: 'opt3', info: 'Info 3' }
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockFontSize.set(16);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should update virtualScrollItemSizePx when root font size changes', () => {
    mockFontSize.set(20);
    expect(component.virtualScrollItemSizePx()).toBe(20 * 2.75);
  });

  it('should display the label when provided', () => {
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.detectChanges();
    const labelElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-label label')
    );
    expect(labelElement.nativeElement.textContent).toBe('Test Label');
  });

  it('should display the placeholder when no value is selected', () => {
    fixture.componentRef.setInput('placeholder', 'Test Placeholder');
    component.value = null;
    fixture.detectChanges();
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    expect(inputElement.nativeElement.placeholder).toBe('Test Placeholder');
  });

  it('should emit inputChanged event when input text changes', fakeAsync(() => {
    jest.spyOn(component.inputChanged, 'emit');
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    inputElement.nativeElement.value = 'Option';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    tick(component.inputChangeDebounceTime); // Advance timer by debounce time
    expect(component.inputChanged.emit).toHaveBeenCalledWith('option');
  }));

  it('should open options menu on input', fakeAsync(() => {
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    inputElement.nativeElement.value = 'Option';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    tick(component.inputChangeDebounceTime); // Wait for debounce time
    fixture.detectChanges();

    expect(component.isOpened).toBeTruthy();
  }));

  it('should select an option when clicked', fakeAsync(() => {
    jest.spyOn(component, 'select');

    // Simulate typing into the input to open options menu
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    inputElement.nativeElement.value = 'Option';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    tick(component.inputChangeDebounceTime); // Wait for debounce time
    fixture.detectChanges();

    const optionElements = fixture.debugElement.queryAll(
      By.css('.cps-autocomplete-options-option')
    );
    expect(optionElements.length).toBeGreaterThan(0);

    optionElements[1].nativeElement.click();
    fixture.detectChanges();

    // Flush the scheduled setTimeout in select method
    tick();

    expect(component.select).toHaveBeenCalledWith(
      component.options[1],
      false,
      true,
      component.multiple
    );

    // Optionally, flush any remaining timers
    discardPeriodicTasks();
  }));

  it('should display selected option label', () => {
    component.value = component.options[0];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const selectedLabel = fixture.debugElement.query(
      By.css('.single-item-selection span')
    );
    expect(selectedLabel.nativeElement.textContent.trim()).toBe('Option 1');
  });

  it('should display multiple selected options as chips', () => {
    fixture.componentRef.setInput('multiple', true);
    component.value = [component.options[0], component.options[2]];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const chipElements = fixture.debugElement.queryAll(By.css('cps-chip'));
    expect(chipElements.length).toBe(2);
    expect(chipElements[0].nativeElement.textContent.trim()).toBe('Option 1');
    expect(chipElements[1].nativeElement.textContent.trim()).toBe('Option 3');
  });

  it('should emit valueChanged event when value changes', () => {
    jest.spyOn(component.valueChanged, 'emit');
    component.select(component.options[1], false);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(
      component.options[1]
    );
  });

  it('should prevent options menu from closing when validating', () => {
    fixture.componentRef.setInput('validating', true);
    const onBlurStub = jest.spyOn(component, 'onBlur');
    fixture.detectChanges();

    // Simulate the options menu trying to close
    const result = component.onBeforeOptionsHidden(
      CpsMenuHideReason.CLICK_OUTSIDE
    );
    expect(result).toBe(undefined);
    expect(onBlurStub).toHaveBeenCalledTimes(0);
  });

  it('should allow options menu to close with ESCAPE key when validating', () => {
    fixture.componentRef.setInput('validating', true);
    jest.spyOn(component, 'clearInput');
    fixture.detectChanges();
    const result = component.onBeforeOptionsHidden(
      CpsMenuHideReason.KEYDOWN_ESCAPE
    );
    expect(result).toBe(undefined);
    expect(component.clearInput).toHaveBeenCalled();
  });

  it('should allow options menu to close with TAB key when validating', () => {
    fixture.componentRef.setInput('validating', true);
    jest.spyOn(component, 'clearInput');
    fixture.detectChanges();
    const result = component.onBeforeOptionsHidden(
      CpsMenuHideReason.KEYDOWN_TAB
    );
    expect(result).toBe(undefined);
    expect(component.clearInput).toHaveBeenCalled();
  });

  it('should display loading indicator when validating', () => {
    fixture.componentRef.setInput('validating', true);
    fixture.detectChanges();
    const progressBar = fixture.debugElement.query(
      By.css('.autocomplete-progress-bar')
    );
    expect(progressBar).toBeTruthy();
  });

  it('should correctly set disabled state', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const container = fixture.debugElement.query(
      By.css('.cps-autocomplete.disabled')
    );
    expect(container).toBeTruthy();

    // Attempt to open options menu
    const autocompleteBox = fixture.debugElement.query(
      By.css('.cps-autocomplete-box')
    );
    autocompleteBox.nativeElement.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(component.isOpened).toBeFalsy();

    // Attempt to focus input
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    inputElement.nativeElement.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(component.isActive).toBeFalsy();
  });

  it('should display error message when externalError is set', () => {
    fixture.componentRef.setInput('externalError', 'External error occurred');
    fixture.detectChanges();
    const errorElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-error')
    );
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'External error occurred'
    );
  });

  it('should clear the value when clear button is clicked', () => {
    component.value = component.options[0];
    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    const clearButton = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-clear-icon cps-icon')
    );
    clearButton.nativeElement.click();
    fixture.detectChanges();

    if (component.multiple) {
      expect(component.value).toEqual([]);
    } else {
      // For single-select, value should be reset to empty value or undefined
      expect(component.value).toBeUndefined();
    }
  });

  it('should display hint when provided', () => {
    fixture.componentRef.setInput('hint', 'Test hint message');
    fixture.detectChanges();
    const hintElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-hint')
    );
    expect(hintElement.nativeElement.textContent.trim()).toBe(
      'Test hint message'
    );
  });

  it('should focus input when focus method is called', () => {
    jest.spyOn(component.autocompleteInput.nativeElement, 'focus');
    component.focus();
    expect(component.autocompleteInput.nativeElement.focus).toHaveBeenCalled();
  });

  it('should filter options based on input', fakeAsync(() => {
    fixture.componentRef.setInput('options', [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' }
    ]);
    fixture.detectChanges();
    const inputElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-input')
    );
    inputElement.nativeElement.value = 'ap';
    inputElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    tick(component.inputChangeDebounceTime); // Advance timer by debounce time
    fixture.detectChanges();

    expect(component.filteredOptions.length).toBe(1);
    expect(component.filteredOptions[0].label).toBe('Apple');
  }));

  it('should display loading message when loading', fakeAsync(() => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingMessage', 'Loading options...');
    fixture.detectChanges();

    // Simulate opening the options menu
    const autocompleteBox = fixture.debugElement.query(
      By.css('.cps-autocomplete-box')
    );
    autocompleteBox.nativeElement.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    tick(); // Wait for any asynchronous operations
    fixture.detectChanges();

    const loadingElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-options-loading')
    );
    expect(loadingElement).toBeTruthy();
    expect(loadingElement.nativeElement.textContent.trim()).toBe(
      'Loading options...'
    );
  }));

  it('should display empty message when no options are available', fakeAsync(() => {
    fixture.componentRef.setInput('options', []);
    component.inputTextDebounced = 'test';
    fixture.componentRef.setInput('showEmptyMessage', true);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    // Open the options menu
    const autocompleteBox = fixture.debugElement.query(
      By.css('.cps-autocomplete-box')
    );
    autocompleteBox.nativeElement.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    tick(); // Wait for any asynchronous updates
    fixture.detectChanges();

    const emptyElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-options-empty')
    );
    expect(emptyElement).toBeTruthy();
    expect(emptyElement.nativeElement.textContent.trim()).toBe(
      'No results found'
    );
  }));

  it('should update value when writeValue is called', () => {
    component.writeValue(component.options[2]);
    expect(component.value).toEqual(component.options[2]);
  });

  it('should display info tooltip when infoTooltip is provided', () => {
    fixture.componentRef.setInput('infoTooltip', 'Tooltip info');
    fixture.componentRef.setInput('label', 'Test Label'); // Label is required for the tooltip to appear
    fixture.detectChanges();
    const infoIcon = fixture.debugElement.query(
      By.css('.cps-autocomplete-label-info-circle')
    );
    expect(infoIcon).toBeTruthy();
  });

  it('should handle setting and getting options', () => {
    component.options = [{ label: 'Option A', value: 'A' }];
    expect(component.options.length).toBe(1);
    expect(component.options[0].label).toBe('Option A');
  });

  it('should toggle options menu when chevron is clicked', fakeAsync(() => {
    fixture.componentRef.setInput('showChevron', true);
    fixture.detectChanges();

    const chevron = fixture.debugElement.query(
      By.css('.cps-autocomplete-box-chevron')
    );
    chevron.triggerEventHandler('mousedown', new Event('mousedown'));
    fixture.detectChanges();

    tick(); // Handle any asynchronous operations
    fixture.detectChanges();

    expect(component.isOpened).toBeTruthy();
  }));

  it('should not open options menu when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const autocompleteBox = fixture.debugElement.query(
      By.css('.cps-autocomplete-box')
    );
    autocompleteBox.nativeElement.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(component.isOpened).toBeFalsy();
  });

  it('should select all options when toggleAll is called', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('selectAll', true);
    component.value = [];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    component.toggleAll();
    fixture.detectChanges();

    expect(component.value.length).toBe(component.options.length);
  });

  it('should apply custom appearance', () => {
    fixture.componentRef.setInput('appearance', 'underlined');
    fixture.detectChanges();
    const container = fixture.debugElement.query(
      By.css('.cps-autocomplete-container.underlined')
    );
    expect(container).toBeTruthy();
  });

  it('should clear input text and reset options when clearInput function is called', () => {
    fixture.componentRef.setInput('options', [
      { label: 'First Option', value: 'A' },
      { label: 'Second Option', value: 'B' },
      { label: 'Third Option', value: 'C' }
    ]);
    const event = new Event('input');
    Object.defineProperty(event, 'target', {
      value: { value: 'First' }
    });

    component.autocompleteInput.nativeElement.dispatchEvent(event);

    expect(component.inputText).toBe('First');
    expect(component.filteredOptions.length).toBe(1);

    component.clearInput();

    expect(component.inputText).toBe('');
    expect(component.filteredOptions.length).toBe(3);
  });

  describe('Scroll alignment', () => {
    let scrollIntoView: jest.Mock;

    beforeEach(() => {
      scrollIntoView = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    });

    it('should scroll the selected option into view with inline: start when the dropdown opens', fakeAsync(() => {
      component.writeValue(component.options[0]);
      fixture.detectChanges();

      component.onBoxClick();
      flush();
      fixture.detectChanges();

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

  describe('Chip Removal', () => {
    beforeEach(() => {
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
      fixture.componentRef.setInput('multiple', true);
      component.value = [component.options[0], component.options[1]];
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

    it('should keep the dropdown open and remove the value when a chip close button is clicked', fakeAsync(() => {
      component.onBoxClick();
      tick();
      fixture.detectChanges();
      expect(component.isOpened).toBe(true);

      const closeBtn = fixture.debugElement.query(
        By.css('.cps-chip-close-btn')
      );
      closeBtn.nativeElement.click();
      fixture.detectChanges();
      tick();

      expect(component.isOpened).toBe(true);
      expect(component.value).not.toContainEqual(component.options[0]);
      expect(component.value).toContainEqual(component.options[1]);
      discardPeriodicTasks();
    }));
  });

  describe('aria-label', () => {
    it('should set aria-label from ariaLabel input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Search options');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        '.cps-autocomplete-box-input'
      );
      expect(input.getAttribute('aria-label')).toBe('Search options');
    });

    it('should set aria-label from label when ariaLabel is not provided', () => {
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.componentRef.setInput('label', 'My Field');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        '.cps-autocomplete-box-input'
      );
      expect(input.getAttribute('aria-label')).toBe('My Field');
    });

    it('should prefer ariaLabel over label', () => {
      fixture.componentRef.setInput('label', 'My Field');
      fixture.componentRef.setInput('ariaLabel', 'Override label');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        '.cps-autocomplete-box-input'
      );
      expect(input.getAttribute('aria-label')).toBe('Override label');
    });

    it('should error when neither label nor ariaLabel is provided', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fixture.componentRef.setInput('label', '');
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ariaLabel')
      );
    });
  });

  describe('keyboard focus ring', () => {
    it('should set isKeyboardFocused to true when focused via keyboard', () => {
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should not set isKeyboardFocused when focus follows a mouse box click', fakeAsync(() => {
      component.onBoxClick();
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(false);
      flush();
      discardPeriodicTasks();
    }));

    it('should set isKeyboardFocused when chevron is activated via keyboard', fakeAsync(() => {
      component.onChevronClick(new KeyboardEvent('keydown', { key: 'Enter' }));
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
      flush();
      discardPeriodicTasks();
    }));

    it('should not set isKeyboardFocused when clear is triggered by mouse', fakeAsync(() => {
      fixture.componentRef.setInput('openOnClear', false);
      component.value = component.options[0];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.clear(new MouseEvent('click'));
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(false);
      flush();
      discardPeriodicTasks();
    }));

    it('should set isKeyboardFocused when clear is triggered by keyboard', fakeAsync(() => {
      fixture.componentRef.setInput('openOnClear', false);
      component.value = component.options[0];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.clear(new KeyboardEvent('keydown', { key: 'Enter' }));
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
      flush();
      discardPeriodicTasks();
    }));

    it('should reset isKeyboardFocused on blur', () => {
      component.isKeyboardFocused = true;
      component.onBlur();
      expect(component.isKeyboardFocused).toBe(false);
    });

    it('should allow next keyboard focus to show ring after blur resets mouse state', fakeAsync(() => {
      component.onBoxClick();
      component.onBlur();
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
      flush();
      discardPeriodicTasks();
    }));

    it('should reset isKeyboardFocused when the box is clicked via mouse', fakeAsync(() => {
      component.isKeyboardFocused = true;
      component.onBoxClick();
      expect(component.isKeyboardFocused).toBe(false);
      flush();
      discardPeriodicTasks();
    }));

    it('should reset isKeyboardFocused when an option is clicked', () => {
      component.isKeyboardFocused = true;
      component.onOptionClick(component.options[0]);
      expect(component.isKeyboardFocused).toBe(false);
    });

    it('should set isKeyboardFocused to true when arrow-down is pressed', () => {
      component.onContainerKeyDown({ keyCode: 40 });
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should set isKeyboardFocused to true when Enter is pressed in the dropdown', () => {
      component.onContainerKeyDown({ keyCode: 13 });
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should not change isKeyboardFocused when Tab is pressed in the container', () => {
      component.isKeyboardFocused = false;
      component.onContainerKeyDown({ keyCode: 9 });
      expect(component.isKeyboardFocused).toBe(false);

      component.isKeyboardFocused = true;
      component.onContainerKeyDown({ keyCode: 9 });
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should apply keyboard-focused class to container when isKeyboardFocused is true', () => {
      component.isKeyboardFocused = true;
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-autocomplete-container.keyboard-focused')
      );
      expect(container).toBeTruthy();
    });
  });

  describe('ngOnInit defaults', () => {
    it('should default value to an empty array in multiple mode with no initial value', () => {
      const f = TestBed.createComponent(CpsAutocompleteComponent);
      const c = f.componentInstance;
      f.componentRef.setInput('ariaLabel', 'Multi');
      f.componentRef.setInput('multiple', true);
      f.detectChanges();
      expect(c.value).toEqual([]);
    });

    it('should default value using emptyOptionIndex in single mode', () => {
      const f = TestBed.createComponent(CpsAutocompleteComponent);
      const c = f.componentInstance;
      f.componentRef.setInput('ariaLabel', 'Single');
      f.componentRef.setInput('options', [
        { label: 'None', value: '' },
        { label: 'Option 1', value: 'opt1' }
      ]);
      f.componentRef.setInput('emptyOptionIndex', 0);
      f.detectChanges();
      expect(c.value).toEqual({ label: 'None', value: '' });
    });
  });

  describe('ngOnChanges', () => {
    it('should recompute cvtWidth when width changes', () => {
      fixture.componentRef.setInput('width', 300);
      fixture.detectChanges();
      expect(component.cvtWidth).toBe('300px');
    });

    it('should reopen options when loading transitions from true to false', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      jest.spyOn(component as any, '_toggleOptions');
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
      expect((component as any)._toggleOptions).toHaveBeenCalledWith(true);
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
    it('should select values instead of full option objects', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      component.toggleAll();
      tick();

      expect(component.value).toEqual(['opt1', 'opt2', 'opt3']);
      discardPeriodicTasks();
    }));
  });

  describe('withOptionsAliases', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('options', [
        { label: 'Apple', value: 'apple', alias: 'fruit-a' },
        { label: 'Banana', value: 'banana', alias: 'fruit-b' }
      ]);
      fixture.detectChanges();
    });

    it('should filter by alias when no label matches and withOptionsAliases is true', () => {
      fixture.componentRef.setInput('withOptionsAliases', true);
      fixture.detectChanges();
      component.filterOptions({ target: { value: 'fruit-b' } });
      expect(component.filteredOptions.length).toBe(1);
      expect(component.filteredOptions[0].label).toBe('Banana');
    });

    it('should fall back to alias matching only when useOptionsAliasesWhenNoMatch is true and no label matches', () => {
      fixture.componentRef.setInput('withOptionsAliases', true);
      fixture.componentRef.setInput('useOptionsAliasesWhenNoMatch', true);
      fixture.detectChanges();
      component.filterOptions({ target: { value: 'fruit-a' } });
      expect(component.filteredOptions.length).toBe(1);
      expect(component.filteredOptions[0].label).toBe('Apple');
    });
  });

  describe('onBlur', () => {
    it('should close the options menu when open', fakeAsync(() => {
      component.onBoxClick();
      tick();
      fixture.detectChanges();
      expect(component.isOpened).toBe(true);

      component.onBlur();
      tick();

      expect(component.isOpened).toBe(false);
      discardPeriodicTasks();
    }));
  });

  describe('onBeforeOptionsHidden with SCROLL/RESIZE', () => {
    it('should only toggle options closed on SCROLL', fakeAsync(() => {
      component.onBoxClick();
      tick();
      fixture.detectChanges();
      jest.spyOn(component, 'clearInput');

      component.onBeforeOptionsHidden(CpsMenuHideReason.SCROLL);

      expect(component.clearInput).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should only toggle options closed on RESIZE', fakeAsync(() => {
      component.onBoxClick();
      tick();
      fixture.detectChanges();
      jest.spyOn(component, 'clearInput');

      component.onBeforeOptionsHidden(CpsMenuHideReason.RESIZE);

      expect(component.clearInput).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('onContainerKeyDown', () => {
    it('should toggle all when Enter is pressed on the select-all option', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      component.optionHighlightedIndex = 0;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      jest.spyOn(component, 'toggleAll');

      component.onContainerKeyDown({ keyCode: 13 });

      expect(component.toggleAll).toHaveBeenCalled();
    });

    it('should select the option at the adjusted index when select-all is visible', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.value = [];
      component.optionHighlightedIndex = 1;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      jest.spyOn(component, 'select');

      component.onContainerKeyDown({ keyCode: 13 });

      expect(component.select).toHaveBeenCalledWith(
        component.options[0],
        false,
        true,
        true
      );
    });

    it('should dehighlight when filtered options differ from full options', () => {
      component.filteredOptions = [component.options[0]];
      component.optionHighlightedIndex = 0;
      jest.spyOn(component as any, '_dehighlightOption');

      component.onContainerKeyDown({ keyCode: 13 });

      expect((component as any)._dehighlightOption).toHaveBeenCalled();
    });

    it('should call virtual navigation when virtualScroll is enabled', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      component.isOpened = true;
      fixture.detectChanges();
      jest.spyOn(component as any, '_navigateVirtualOptionsByArrows');

      component.onContainerKeyDown({ keyCode: 40 });

      expect(
        (component as any)._navigateVirtualOptionsByArrows
      ).toHaveBeenCalledWith(false);
    });
  });

  describe('onInputKeyDown', () => {
    it('should remove the last value on backspace with empty input', () => {
      fixture.componentRef.setInput('multiple', true);
      component.value = [component.options[0]];
      component.inputText = '';
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      const event = { keyCode: 8, stopPropagation: jest.fn() };

      component.onInputKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.backspaceClickedOnce).toBe(true);
    });

    it('should open the options menu on Enter when closed', () => {
      component.isOpened = false;
      const event = {
        keyCode: 13,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      };

      component.onInputKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isOpened).toBe(true);
    });

    it('should confirm input on Enter when open and nothing is highlighted', () => {
      component.isOpened = true;
      component.optionHighlightedIndex = -1;
      const event = {
        keyCode: 13,
        target: { value: 'Option 1' },
        stopPropagation: jest.fn()
      };
      jest.spyOn(component as any, '_confirmInput');

      component.onInputKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect((component as any)._confirmInput).toHaveBeenCalledWith(
        'Option 1',
        true
      );
    });

    it('should preventDefault on arrow keys', () => {
      const event = { keyCode: 38, preventDefault: jest.fn() };
      component.onInputKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onChevronClick', () => {
    it('should close and clear when already open', () => {
      component.isOpened = true;
      jest.spyOn(component, 'clearInput');
      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      };

      component.onChevronClick(event);

      expect(component.clearInput).toHaveBeenCalled();
    });
  });

  describe('getOptionId', () => {
    it('should build an id for a primitive option', () => {
      const id = component.getOptionId('opt1', 0);
      expect(id).toContain('-0');
    });
  });

  describe('with NgControl (reactive forms)', () => {
    @Component({
      imports: [CpsAutocompleteComponent, ReactiveFormsModule],
      template: `<cps-autocomplete
        [formControl]="control"
        [options]="options"
        ariaLabel="Autocomplete"></cps-autocomplete>`
    })
    class HostComponent {
      control = new FormControl(undefined, Validators.required);
      options = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' }
      ];
    }

    let hostFixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let autocomplete: CpsAutocompleteComponent;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [
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
      autocomplete = hostFixture.debugElement.children[0].componentInstance;
    });

    it('should register itself as the valueAccessor on the NgControl', () => {
      autocomplete.select(autocomplete.options[0], false);
      hostFixture.detectChanges();
      expect(host.control.value).toEqual(autocomplete.options[0]);
    });

    it('should report isRequired true when a required validator is present', () => {
      expect(autocomplete.isRequired).toBe(true);
    });

    it('should report isRequired false when no required validator is present', () => {
      host.control.clearValidators();
      host.control.updateValueAndValidity();
      expect(autocomplete.isRequired).toBe(false);
    });

    it('should set a required error message when touched and invalid', () => {
      host.control.markAsTouched();
      host.control.updateValueAndValidity();
      expect(autocomplete.error).toBe('Field is required');
    });

    it('should not set an error when the control has not been touched', () => {
      autocomplete.onBlur();
      expect(autocomplete.error).toBe('');
    });

    it('should clear the error when the control becomes valid', () => {
      host.control.markAsTouched();
      host.control.setValue(autocomplete.options[0]);
      autocomplete.onBlur();
      expect(autocomplete.error).toBe('');
    });

    it('should use a custom string error message when present', () => {
      host.control.setValidators(() => ({ custom: 'Custom failure' }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      autocomplete.onBlur();
      expect(autocomplete.error).toBe('Custom failure');
    });

    it('should fall back to "Unknown error" for non-string error values', () => {
      host.control.setValidators(() => ({ custom: true }));
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      autocomplete.onBlur();
      expect(autocomplete.error).toBe('Unknown error');
    });

    it('should prioritize the error id in describedBy over the hint id', () => {
      autocomplete.hint = 'Some hint';
      host.control.markAsTouched();
      autocomplete.onBlur();
      expect(autocomplete.describedBy).toBe(autocomplete.errorId);
    });
  });

  describe('virtual scroll navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
    });

    it('recalcVirtualListHeight should update virtualListHeightRem based on filtered options', () => {
      component.filteredOptions = [component.options[0]];
      component.recalcVirtualListHeight();
      expect(component.virtualListHeightRem).toBeCloseTo(2.75 * 1);
    });

    it('should not navigate when the menu is closed', () => {
      component.isOpened = false;
      (component as any)._navigateVirtualOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(-1);
    });

    it('should navigate forward through virtual options', () => {
      component.isOpened = true;
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = -1;
      (component as any)._navigateVirtualOptionsByArrows(false);
      expect(component.optionHighlightedIndex).toBe(0);
      expect(component.isArrowNavigating).toBe(true);
    });

    it('should navigate backward and wrap to the last item', () => {
      component.isOpened = true;
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = 0;
      (component as any)._navigateVirtualOptionsByArrows(true);
      expect(component.optionHighlightedIndex).toBe(
        component.options.length - 1
      );
    });

    it('should scroll the virtual list to the given index via virtualList.scrollToIndex when no scroller element exists', () => {
      component.filteredOptions = component.options;
      (component as any).optionsList = {
        nativeElement: document.createElement('div')
      };
      const scrollToIndex = jest.fn();
      (component as any).virtualList = { scrollToIndex };
      (component as any)._scrollVirtualListToIndex(1);
      expect(scrollToIndex).toHaveBeenCalledWith(1);
    });
  });

  describe('_confirmInput', () => {
    it('should do nothing when the menu is closed', () => {
      component.isOpened = false;
      jest.spyOn(component, 'clearInput');
      (component as any)._confirmInput('', false);
      expect(component.clearInput).not.toHaveBeenCalled();
    });

    it('should close and clear in multiple mode with empty search', () => {
      fixture.componentRef.setInput('multiple', true);
      component.isOpened = true;
      fixture.detectChanges();
      jest.spyOn(component, 'clearInput');

      (component as any)._confirmInput('', false);

      expect(component.clearInput).toHaveBeenCalled();
    });

    it('should update value to empty when input is cleared in single mode', fakeAsync(() => {
      component.isOpened = true;
      component.activeSingle = true;
      component.value = component.options[0];
      component.inputText = 'something else';
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      (component as any)._confirmInput('', true);
      tick();

      expect(component.value).not.toEqual(component.options[0]);
      discardPeriodicTasks();
    }));

    it('should select a matching option by typed label', () => {
      component.isOpened = true;
      component.filteredOptions = component.options;

      (component as any)._confirmInput('option 2', true);

      expect(component.value).toEqual(component.options[1]);
    });

    it('should restore the current label when no option matches the typed text', () => {
      component.isOpened = true;
      component.value = component.options[0];
      component.filteredOptions = component.options;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      (component as any)._confirmInput('nonexistent', true);

      expect(component.inputText).toBe('Option 1');
      expect(component.filteredOptions).toEqual(component.options);
    });

    it('should select the first filtered option for a time-picker field when no match is found', () => {
      component.isOpened = true;
      (component as any).isTimePickerField = true;
      component.filteredOptions = component.options;
      const selectSpy = jest.spyOn(component, 'select');

      (component as any)._confirmInput('nonexistent', true);

      expect(selectSpy).toHaveBeenCalledWith(
        component.options[0],
        false,
        false,
        true
      );
    });
  });

  describe('select with returnObject false', () => {
    it('should use the option value in single-select mode', () => {
      fixture.componentRef.setInput('returnObject', false);
      fixture.detectChanges();
      component.select(component.options[1], false, false, false);
      expect(component.value).toBe('opt2');
    });

    it('should use option values when adding without keepInitialOrder', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      component.value = [];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.select(component.options[0], false, false, false);
      expect(component.value).toEqual(['opt1']);
    });

    it('should use option values when adding with keepInitialOrder', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('keepInitialOrder', true);
      component.value = ['opt3'];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      component.select(component.options[0], false, false, false);
      expect(component.value).toEqual(['opt1', 'opt3']);
    });

    it('should not schedule a focus timeout when needFocusInput is false', fakeAsync(() => {
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.select(component.options[0], false, false, false);
      tick(10);
      expect(focusSpy).not.toHaveBeenCalled();
    }));

    it('should not clear the input when needClearInput is false', () => {
      component.inputText = 'typed';
      component.select(component.options[0], false, false, false);
      expect(component.inputText).toBe('typed');
    });
  });

  describe('onBoxClick when already open', () => {
    it('should not reopen the menu when already open', fakeAsync(() => {
      (component as any)._toggleOptions(true);
      tick();
      const toggleSpy = jest.spyOn(component as any, '_toggleOptions');
      component.onBoxClick();
      tick();
      expect(toggleSpy).not.toHaveBeenCalledWith(true);
      discardPeriodicTasks();
    }));
  });

  describe('_syncHighlightToValue', () => {
    it('should highlight based on the first selected value in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', false);
      component.value = [component.options[1]];
      component.filteredOptions = component.options;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      (component as any)._syncHighlightToValue();
      expect(component.optionHighlightedIndex).toBe(1);
    });

    it('should leave the highlighted index untouched when the value is not among the filtered options', () => {
      component.optionHighlightedIndex = -1;
      component.value = { label: 'Missing', value: 'missing' };
      component.filteredOptions = component.options;
      (component as any)._syncHighlightToValue();
      expect(component.optionHighlightedIndex).toBe(-1);
    });
  });

  describe('_getHighlightedOptionId', () => {
    it('should return null when nothing is highlighted', () => {
      component.optionHighlightedIndex = -1;
      expect((component as any)._getHighlightedOptionId()).toBeNull();
    });

    it('should return the select-all id when the select-all option is highlighted', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('selectAll', true);
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = 0;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect((component as any)._getHighlightedOptionId()).toBe(
        component.selectAllOptionId
      );
    });

    it('should return null when the highlighted option no longer exists', () => {
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = 99;
      expect((component as any)._getHighlightedOptionId()).toBeNull();
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

    it('should stop when the highlighted option id cannot be resolved', () => {
      component.isOpened = true;
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = 99;
      expect(() =>
        (component as any)._navigateOptionsByArrows(false)
      ).not.toThrow();
    });

    it('should highlight the option element when found in the DOM', () => {
      component.isOpened = true;
      component.filteredOptions = component.options;
      component.optionHighlightedIndex = -1;
      fixture.detectChanges();
      const optionId = component.getOptionId(component.options[0], 0);
      const el = document.createElement('div');
      el.id = optionId;
      const parent = document.createElement('div');
      parent.appendChild(el);
      component.optionsList.nativeElement.appendChild(parent);

      (component as any)._navigateOptionsByArrows(false);

      expect(component.optionHighlightedIndex).toBe(0);
    });
  });

  describe('_navigateVirtualOptionsByArrows', () => {
    it('should do nothing when there are no filtered options', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      component.filteredOptions = [];
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

  describe('getOptionId caching', () => {
    it('should use the id cached from the option set at its original index, ignoring a later index argument', () => {
      const option = component.options[0];
      const idAtOriginalIndex = component.getOptionId(option, 0);
      const idWithDifferentIndexArg = component.getOptionId(option, 5);
      expect(idWithDifferentIndexArg).toBe(idAtOriginalIndex);
      expect(idWithDifferentIndexArg).not.toContain('-5');
    });
  });

  describe('_getEmptyValue with returnObject false', () => {
    it('should return the option value instead of the object', () => {
      fixture.componentRef.setInput('returnObject', false);
      fixture.componentRef.setInput('emptyOptionIndex', 0);
      fixture.detectChanges();
      expect((component as any)._getEmptyValue()).toBe('opt1');
    });
  });

  describe('_getValueLabel with returnObject false', () => {
    it('should use LabelByValuePipe to resolve the label', () => {
      fixture.componentRef.setInput('returnObject', false);
      component.value = 'opt2';
      fixture.detectChanges();
      expect((component as any)._getValueLabel()).toBe('Option 2');
    });
  });

  describe('_checkErrors with an empty errors object', () => {
    it('should clear the error when the errors object has no keys', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: {}
      };
      component.error = 'stale';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });
  });

  describe('_removeLastValue', () => {
    it('should do nothing in single mode', () => {
      fixture.componentRef.setInput('multiple', false);
      expect(() => (component as any)._removeLastValue()).not.toThrow();
    });

    it('should do nothing when inputText is not empty', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = 'typed';
      (component as any)._removeLastValue();
      expect(component.backspaceClickedOnce).toBe(false);
    });

    it('should not arm backspaceClickedOnce when there is no selection', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = '';
      component.value = [];
      (component as any)._removeLastValue();
      expect(component.backspaceClickedOnce).toBe(false);
    });
  });

  describe('_toggleOptions toggle without explicit show', () => {
    it('should call optionsMenu.toggle when show is omitted', () => {
      const toggleSpy = jest.spyOn(component.optionsMenu, 'toggle');
      (component as any)._toggleOptions();
      expect(toggleSpy).toHaveBeenCalledWith({
        target: component.autocompleteBox.nativeElement
      });
    });
  });

  describe('_toggleOptions setTimeout scroll behavior', () => {
    it('should scroll the virtual list to the highlighted index when there is no selected element', fakeAsync(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      component.filteredOptions = component.options;
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

  describe('track expression / NG0956 regression', () => {
    function chipTexts(): string[] {
      return fixture.debugElement
        .queryAll(By.css('cps-chip'))
        .map((el) => el.nativeElement.textContent.trim());
    }

    it('should not warn when options are replaced with new-but-value-equal objects (mirrors cps-paginator._syncRows)', () => {
      fixture.componentRef.setInput('multiple', true);
      component.value = [component.options[0], component.options[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const NEW_OPTIONS = component.options.map((o: any) => ({ ...o }));
      fixture.componentRef.setInput('options', NEW_OPTIONS);
      component.value = [NEW_OPTIONS[0], NEW_OPTIONS[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      expect(chipTexts()).toEqual(['Option 1', 'Option 3']);
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
      component.value = [1, 3];
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

      expect(chipTexts()).toEqual(['One', 'Three']);
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
      component.value = [FALSY_OPTIONS[0], FALSY_OPTIONS[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const NEW_FALSY = FALSY_OPTIONS.map((o) => ({ ...o }));
      fixture.componentRef.setInput('options', NEW_FALSY);
      component.value = [NEW_FALSY[0], NEW_FALSY[2]];
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('NG0956')
      );
      warnSpy.mockRestore();

      expect(chipTexts()).toEqual(['Zero', 'False']);
    });

    it('should not throw when the multi-select value array contains null/undefined elements (returnObject: false)', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('returnObject', false);
      expect(() => {
        component.value = ['opt1', null, undefined, 'opt3'];
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should render chips correctly for primitive (non-object) options in multi-select', () => {
      fixture.componentRef.setInput('options', ['opt1', 'opt2', 'opt3']);
      fixture.componentRef.setInput('returnObject', true);
      fixture.componentRef.setInput('multiple', true);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      component.value = ['opt1', 'opt3'];
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
      component.value = [CITY_OPTIONS[0].data, CITY_OPTIONS[2].data];
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

    it('should not throw when two options share the same optionValue (pre-existing unsupported configuration)', () => {
      const DUPLICATE_OPTIONS = [
        { label: 'First', value: 'dup' },
        { label: 'Second', value: 'dup' }
      ];
      fixture.componentRef.setInput('options', DUPLICATE_OPTIONS);
      fixture.componentRef.setInput('multiple', true);
      expect(() => {
        component.value = [...DUPLICATE_OPTIONS];
        fixture.changeDetectorRef.markForCheck();
        fixture.detectChanges();
      }).not.toThrow();
    });
  });
});
