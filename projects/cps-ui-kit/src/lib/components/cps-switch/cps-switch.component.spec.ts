import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsSwitchComponent } from './cps-switch.component';
import { FormsModule } from '@angular/forms';

describe('CpsSwitchComponent', () => {
  let component: CpsSwitchComponent;
  let fixture: ComponentFixture<CpsSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsSwitchComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.disabled).toBe(false);
    expect(component.value).toBe(false);
    expect(component.infoTooltip).toBe('');
    expect(component.infoTooltipClass).toBe('cps-tooltip-content');
    expect(component.infoTooltipMaxWidth).toBe('100%');
    expect(component.infoTooltipPersistent).toBe(false);
    expect(component.infoTooltipPosition).toBe('top');
  });

  it('should render label', () => {
    component.label = 'Enable Feature';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cps-switch-label');
    expect(label.textContent).toContain('Enable Feature');
  });

  it('should toggle value when clicked', () => {
    expect(component.value).toBe(false);
    const switchEl = fixture.nativeElement.querySelector('input');
    switchEl.click();
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
    component.infoTooltip = 'This is a switch';
    component.label = 'Test';
    fixture.detectChanges();
    const infoCircle = fixture.nativeElement.querySelector('cps-info-circle');
    expect(infoCircle).toBeTruthy();
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

  it('should prevent default event when updating value', () => {
    const event = new Event('click');
    jest.spyOn(event, 'preventDefault');
    component.updateValueEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should have disabled class when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    const switchLabel = fixture.nativeElement.querySelector(
      '.cps-switch-label'
    );
    if (switchLabel) {
      expect(switchLabel.classList.contains('cps-switch-label-disabled')).toBe(
        true
      );
    }
    const input = fixture.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('should support setDisabledState', () => {
    expect(() => component.setDisabledState(true)).not.toThrow();
  });

  it('should call onChange when value is set', () => {
    const onChangeSpy = jest.spyOn(component, 'onChange');
    component.value = true;
    expect(onChangeSpy).toHaveBeenCalledWith(true);
  });

  it('should update value to false when clicking on switch', () => {
    component.value = true;
    fixture.detectChanges();
    const switchEl = fixture.nativeElement.querySelector('input');
    switchEl.click();
    expect(component.value).toBe(false);
  });
});
