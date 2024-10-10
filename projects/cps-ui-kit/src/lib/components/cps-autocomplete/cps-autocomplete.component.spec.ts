import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsAutocompleteComponent } from './cps-autocomplete.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value.pipe';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CpsMenuHideReason } from '../cps-menu/cps-menu.component';

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
      providers: [LabelByValuePipe, CheckOptionSelectedPipe],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements and attributes
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsAutocompleteComponent);
    component = fixture.componentInstance;
    component.options = [
      { label: 'Option 1', value: 'opt1', info: 'Info 1' },
      { label: 'Option 2', value: 'opt2', info: 'Info 2' },
      { label: 'Option 3', value: 'opt3', info: 'Info 3' }
    ];
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the label when provided', () => {
    component.label = 'Test Label';
    fixture.detectChanges();
    const labelElement = fixture.debugElement.query(
      By.css('.cps-autocomplete-label label')
    );
    expect(labelElement.nativeElement.textContent).toBe('Test Label');
  });

  it('should display the placeholder when no value is selected', () => {
    component.placeholder = 'Test Placeholder';
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
    fixture.detectChanges();
    const selectedLabel = fixture.debugElement.query(
      By.css('.single-item-selection span')
    );
    expect(selectedLabel.nativeElement.textContent.trim()).toBe('Option 1');
  });

  it('should display multiple selected options as chips', () => {
    component.multiple = true;
    component.value = [component.options[0], component.options[2]];
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
    component.validating = true;
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
    component.validating = true;
    const onBlurStub = jest.spyOn(component, 'onBlur');
    fixture.detectChanges();
    const result = component.onBeforeOptionsHidden(
      CpsMenuHideReason.KEYDOWN_ESCAPE
    );
    expect(result).toBe(undefined);
    expect(onBlurStub).toHaveBeenCalledTimes(1);
  });

  it('should display loading indicator when validating', () => {
    component.validating = true;
    fixture.detectChanges();
    const progressBar = fixture.debugElement.query(
      By.css('.autocomplete-progress-bar')
    );
    expect(progressBar).toBeTruthy();
  });

  it('should correctly set disabled state', () => {
    component.disabled = true;
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

    expect(component.isActive()).toBeFalsy();
  });

  it('should display error message when externalError is set', () => {
    component.externalError = 'External error occurred';
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
    component.clearable = true;
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
    component.hint = 'Test hint message';
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
    component.options = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' }
    ];
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
    component.loading = true;
    component.loadingMessage = 'Loading options...';
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
    component.options = [];
    component.inputTextDebounced = 'test';
    component.showEmptyMessage = true;
    component.loading = false;
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
    component.infoTooltip = 'Tooltip info';
    component.label = 'Test Label'; // Label is required for the tooltip to appear
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
    component.showChevron = true;
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
    component.disabled = true;
    fixture.detectChanges();

    const autocompleteBox = fixture.debugElement.query(
      By.css('.cps-autocomplete-box')
    );
    autocompleteBox.nativeElement.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(component.isOpened).toBeFalsy();
  });

  it('should select all options when toggleAll is called', () => {
    component.multiple = true;
    component.selectAll = true;
    component.value = [];
    fixture.detectChanges();

    component.toggleAll();
    fixture.detectChanges();

    expect(component.value.length).toBe(component.options.length);
  });

  it('should apply custom appearance', () => {
    component.appearance = 'underlined';
    fixture.detectChanges();
    const container = fixture.debugElement.query(
      By.css('.cps-autocomplete-container.underlined')
    );
    expect(container).toBeTruthy();
  });
});
