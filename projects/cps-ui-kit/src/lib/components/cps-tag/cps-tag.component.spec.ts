import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsTagComponent } from './cps-tag.component';
import { FormsModule } from '@angular/forms';

describe('CpsTagComponent', () => {
  let component: CpsTagComponent;
  let fixture: ComponentFixture<CpsTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsTagComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.color).toBe('calm');
    expect(component.disabled).toBe(false);
    expect(component.selectable).toBe(false);
    expect(component.value).toBe(false);
  });

  it('should render label', () => {
    component.label = 'Test Tag';
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector('p');
    expect(tag.textContent).toContain('Test Tag');
  });

  it('should add selectable class when selectable', () => {
    component.selectable = true;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-tag--selectable');
  });

  it('should add disabled class when disabled', () => {
    component.disabled = true;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-tag--disabled');
  });

  it('should toggle value when clicked and selectable', () => {
    component.selectable = true;
    expect(component.value).toBe(false);
    component.toggleSelected();
    expect(component.value).toBe(true);
  });

  it('should not toggle when disabled', () => {
    component.selectable = true;
    component.disabled = true;
    component.value = false;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should not toggle when not selectable', () => {
    component.selectable = false;
    component.value = false;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should emit valueChanged event when value changes', () => {
    jest.spyOn(component.valueChanged, 'emit');
    component.selectable = true;
    component.toggleSelected();
    expect(component.valueChanged.emit).toHaveBeenCalledWith(true);
  });

  it('should write value through ControlValueAccessor', () => {
    component.writeValue(true);
    expect(component.value).toBe(true);
  });

  it('should register onChange callback properly', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.selectable = true;
    component.toggleSelected();
    expect(fn).toHaveBeenCalled();
  });

  it('should register onTouched callback', () => {
    const fn = jest.fn();
    component.registerOnTouched(fn);
    expect(component.onTouched).toBe(fn);
  });

  it('should always have base class', () => {
    component.ngOnChanges();
    expect(component.classesList).toContain('cps-tag');
  });

  it('should call setClasses on ngOnChanges', () => {
    const spy = jest.spyOn(component, 'setClasses');
    component.ngOnChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should set custom color', () => {
    component.color = 'primary';
    component.ngOnChanges();
    expect(component.color).toBeTruthy();
  });

  it('should toggle from true to false', () => {
    component.selectable = true;
    component.value = true;
    component.toggleSelected();
    expect(component.value).toBe(false);
  });

  it('should call onChange when value is set after registration', () => {
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.value = true;
    expect(fn).toHaveBeenCalledWith(true);
  });
});
