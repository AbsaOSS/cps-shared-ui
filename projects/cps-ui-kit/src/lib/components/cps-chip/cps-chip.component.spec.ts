import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsChipComponent } from './cps-chip.component';

describe('CpsChipComponent', () => {
  let component: CpsChipComponent;
  let fixture: ComponentFixture<CpsChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsChipComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.label).toBe('');
    expect(component.icon).toBe('');
    expect(component.iconColor).toBe('text-darkest');
    expect(component.iconPosition).toBe('before');
    expect(component.closable).toBe(false);
    expect(component.disabled).toBe(false);
  });

  it('should render label', () => {
    component.label = 'Test Chip';
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.cps-chip');
    expect(chip.textContent).toContain('Test Chip');
  });

  it('should display close icon when closable', () => {
    component.closable = true;
    fixture.detectChanges();
    const closeIcon = fixture.nativeElement.querySelector(
      '.cps-chip-close-icon'
    );
    expect(closeIcon).toBeTruthy();
  });

  it('should emit closed event when close icon is clicked', () => {
    jest.spyOn(component.closed, 'emit');
    component.closable = true;
    component.label = 'Test';
    fixture.detectChanges();
    const closeIcon = fixture.nativeElement.querySelector(
      '.cps-chip-close-icon'
    );
    closeIcon.click();
    expect(component.closed.emit).toHaveBeenCalledWith('Test');
  });

  it('should stop propagation on close click', () => {
    const event = new Event('click');
    jest.spyOn(event, 'stopPropagation');
    component.onCloseClick(event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should display custom icon when icon is provided', () => {
    component.icon = 'home';
    component.label = 'Home';
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('cps-icon');
    expect(icon).toBeTruthy();
  });

  it('should add disabled class when disabled', () => {
    component.disabled = true;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-chip-disabled');
  });

  it('should add icon-before class when icon is before', () => {
    component.icon = 'home';
    component.label = 'Home';
    component.iconPosition = 'before';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-chip--icon-before');
  });

  it('should add icon-after class when icon is after', () => {
    component.icon = 'home';
    component.label = 'Home';
    component.iconPosition = 'after';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-chip--icon-after');
  });

  it('should always have base class', () => {
    component.ngOnChanges();
    expect(component.classesList).toContain('cps-chip');
  });

  it('should not add icon position class if no icon', () => {
    component.label = 'Test';
    component.icon = '';
    component.ngOnChanges();
    expect(component.classesList).not.toContain('cps-chip--icon-before');
    expect(component.classesList).not.toContain('cps-chip--icon-after');
  });

  it('should not add icon position class if no label', () => {
    component.icon = 'home';
    component.label = '';
    component.ngOnChanges();
    expect(component.classesList).not.toContain('cps-chip--icon-before');
    expect(component.classesList).not.toContain('cps-chip--icon-after');
  });

  it('should set custom icon color', () => {
    component.iconColor = 'primary';
    fixture.detectChanges();
    expect(component.iconColor).toBe('primary');
  });

  it('should call setClasses on ngOnChanges', () => {
    const spy = jest.spyOn(component, 'setClasses');
    component.ngOnChanges();
    expect(spy).toHaveBeenCalled();
  });
});
