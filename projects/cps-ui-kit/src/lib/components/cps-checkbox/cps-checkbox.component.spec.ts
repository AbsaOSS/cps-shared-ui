import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsCheckboxComponent } from './cps-checkbox.component';
import { FormsModule, NgControl } from '@angular/forms';

describe('CpsCheckboxComponent', () => {
  let component: CpsCheckboxComponent;
  let fixture: ComponentFixture<CpsCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsCheckboxComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.disabled).toBe(false);
    expect(component.infoTooltip).toBe('');
    expect(component.infoTooltipClass).toBe('cps-tooltip-content');
    expect(component.infoTooltipMaxWidth).toBe('100%');
    expect(component.infoTooltipPersistent).toBe(false);
    expect(component.infoTooltipPosition).toBe('top');
    expect(component.icon).toBe('');
    expect(component.value).toBe(false);
  });

  it('should render checkbox with label', () => {
    component.label = 'Accept Terms';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cps-checkbox-label');
    expect(label.textContent).toContain('Accept Terms');
  });

  it('should toggle value when clicked', () => {
    expect(component.value).toBe(false);
    const checkboxInput = fixture.nativeElement.querySelector('input');
    checkboxInput.click();
    expect(component.value).toBe(true);
  });

  it('should emit valueChanged event when value changes', () => {
    jest.spyOn(component.valueChanged, 'emit');
    const input = fixture.nativeElement.querySelector('input');
    input.click();
    expect(component.valueChanged.emit).toHaveBeenCalledWith(true);
  });

  it('should not toggle when disabled', () => {
    component.disabled = true;
    component.value = false;
    fixture.detectChanges();
    const event = new Event('click');
    component.updateValueEvent(event);
    expect(component.value).toBe(false);
  });

  it('should display info tooltip when infoTooltip is provided', () => {
    component.infoTooltip = 'This is important info';
    component.label = 'Test';
    fixture.detectChanges();
    const infoCircle = fixture.nativeElement.querySelector('cps-info-circle');
    expect(infoCircle).toBeTruthy();
  });

  it('should display custom icon when icon is provided', () => {
    component.icon = 'check';
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('cps-icon');
    expect(icon).toBeTruthy();
  });

  it('should call onChange when value is set', () => {
    const onChangeSpy = jest.spyOn(component, 'onChange');
    component.value = true;
    expect(onChangeSpy).toHaveBeenCalledWith(true);
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue(true);
    expect(component.value).toBe(true);
  });

  it('should register onChange callback', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.value = true;
    expect(fn).toHaveBeenCalledWith(true);
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should focus input when focus method is called', () => {
    const input = fixture.nativeElement.querySelector('input');
    jest.spyOn(input, 'focus');
    component.focus();
    expect(input.focus).toHaveBeenCalled();
  });

  it('should have disabled class when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('.cps-checkbox');
    expect(checkbox.classList.contains('cps-checkbox-disabled')).toBe(true);
  });

  it('should prevent default event when updating value', () => {
    const event = new Event('click');
    jest.spyOn(event, 'preventDefault');
    component.updateValueEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should set icon color on init', () => {
    component.iconColor = 'primary';
    component.ngOnInit();
    expect(component.iconColor).toBeTruthy();
  });

  it('should support setDisabledState', () => {
    // Method exists but is empty, just verify it can be called
    expect(() => component.setDisabledState(true)).not.toThrow();
  });

  it('should update value to false when clicking checked checkbox', () => {
    component.value = true;
    fixture.detectChanges();
    const checkboxInput = fixture.nativeElement.querySelector('input');
    checkboxInput.click();
    expect(component.value).toBe(false);
  });

  it('should have correct checkbox input type', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('checkbox');
  });
});
