import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsButtonComponent } from './cps-button.component';

describe('CpsButtonComponent', () => {
  let component: CpsButtonComponent;
  let fixture: ComponentFixture<CpsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test button');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.color).toBe('calm');
    expect(component.contentColor).toBe('white');
    expect(component.borderRadius).toBe('4px');
    expect(component.type).toBe('solid');
    expect(component.label).toBe('');
    expect(component.icon).toBe('');
    expect(component.iconPosition).toBe('before');
    expect(component.size).toBe('normal');
    expect(component.width).toBe(0);
    expect(component.height).toBe(0);
    expect(component.disabled).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('should render button with label', () => {
    fixture.componentRef.setInput('label', 'Click Me');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Click Me');
  });

  it('should apply solid type class', () => {
    fixture.componentRef.setInput('type', 'solid');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--solid');
  });

  it('should apply outlined type class', () => {
    fixture.componentRef.setInput('type', 'outlined');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--outlined');
  });

  it('should apply borderless type class', () => {
    fixture.componentRef.setInput('type', 'borderless');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--borderless');
  });

  it('should apply normal size class', () => {
    fixture.componentRef.setInput('size', 'normal');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--normal');
  });

  it('should apply large size class', () => {
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--large');
  });

  it('should apply small size class', () => {
    fixture.componentRef.setInput('size', 'small');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--small');
  });

  it('should apply xsmall size class', () => {
    fixture.componentRef.setInput('size', 'xsmall');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--xsmall');
  });

  it('should apply icon-before class when icon and label are present', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.componentRef.setInput('label', 'Home');
    fixture.componentRef.setInput('iconPosition', 'before');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--icon-before');
  });

  it('should apply icon-after class when icon and label are present', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.componentRef.setInput('label', 'Home');
    fixture.componentRef.setInput('iconPosition', 'after');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--icon-after');
  });

  it('should emit clicked event when button is clicked', () => {
    jest.spyOn(component.clicked, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(component.clicked.emit).toHaveBeenCalled();
  });

  it('should set custom width', () => {
    fixture.componentRef.setInput('width', 200);
    fixture.detectChanges();
    expect(component.cvtWidth).toBe('200px');
  });

  it('should set custom width as string', () => {
    fixture.componentRef.setInput('width', '50%');
    fixture.detectChanges();
    expect(component.cvtWidth).toBe('50%');
  });

  it('should set custom height', () => {
    fixture.componentRef.setInput('height', 50);
    fixture.detectChanges();
    expect(component.cvtHeight).toBe('50px');
  });

  it('should calculate font size based on custom height', () => {
    fixture.componentRef.setInput('height', 100);
    fixture.detectChanges();
    expect(component.cvtFontSize).toBe('40px');
  });

  it('should calculate icon size based on custom height', () => {
    fixture.componentRef.setInput('height', 100);
    fixture.detectChanges();
    expect(component.cvtIconSize).toBe('40px');
  });

  it('should convert border radius from number to string', () => {
    fixture.componentRef.setInput('borderRadius', 8);
    fixture.detectChanges();
    expect(component.borderRadius).toBe('8px');
  });

  it('should keep border radius as string if already string', () => {
    fixture.componentRef.setInput('borderRadius', '1rem');
    fixture.detectChanges();
    expect(component.borderRadius).toBe('1rem');
  });

  it('should display loading indicator when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const loader = fixture.nativeElement.querySelector('cps-progress-circular');
    expect(loader).toBeTruthy();
  });

  it('should disable button when disabled is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should render icon when icon is provided', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.componentRef.setInput('label', 'Home');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('cps-icon');
    expect(icon).toBeTruthy();
  });

  it('should set button color', () => {
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.buttonColor).toBeTruthy();
  });

  it('should set text color for solid type', () => {
    fixture.componentRef.setInput('type', 'solid');
    fixture.componentRef.setInput('contentColor', 'black');
    fixture.detectChanges();
    expect(component.textColor).toBeTruthy();
  });

  it('should set text color to button color for outlined type', () => {
    fixture.componentRef.setInput('type', 'outlined');
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.textColor).toBe(component.buttonColor);
  });

  it('should set text color to button color for borderless type', () => {
    fixture.componentRef.setInput('type', 'borderless');
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.textColor).toBe(component.buttonColor);
  });

  it('should always have base class cps-button', () => {
    fixture.componentRef.setInput('type', 'solid');
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button');
  });

  it('should handle height with different units', () => {
    fixture.componentRef.setInput('height', '5rem');
    fixture.detectChanges();
    expect(component.cvtHeight).toBe('5rem');
    expect(component.cvtFontSize).toContain('rem');
    expect(component.cvtIconSize).toContain('rem');
  });

  it('should not apply icon position class if no icon', () => {
    fixture.componentRef.setInput('label', 'Test');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    expect(component.classesList).not.toContain('cps-button--icon-before');
    expect(component.classesList).not.toContain('cps-button--icon-after');
  });

  it('should not apply icon position class if no label', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    expect(component.classesList).not.toContain('cps-button--icon-before');
    expect(component.classesList).not.toContain('cps-button--icon-after');
  });

  it('should clear enterActive when disabled becomes true', () => {
    component.enterActive = true;
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.enterActive).toBe(false);
  });

  it('should clear enterActive when loading becomes true', () => {
    component.enterActive = true;
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(component.enterActive).toBe(false);
  });

  it('should clear enterActive on blur', () => {
    component.enterActive = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new Event('blur'));
    expect(component.enterActive).toBe(false);
  });

  describe('aria-label', () => {
    it('should set aria-label from ariaLabel input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Save');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Save');
    });

    it('should set aria-label from label when ariaLabel is not provided', () => {
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.componentRef.setInput('label', 'Submit');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Submit');
    });

    it('should prefer ariaLabel over label', () => {
      fixture.componentRef.setInput('label', 'Submit');
      fixture.componentRef.setInput('ariaLabel', 'Submit form');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Submit form');
    });

    it('should not set aria-label when neither label nor ariaLabel is provided', () => {
      fixture.componentRef.setInput('label', '');
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBeNull();
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
});
