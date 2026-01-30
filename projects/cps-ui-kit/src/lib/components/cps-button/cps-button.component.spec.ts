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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.color).toBe('calm');
    expect(component.contentColor).toBe('white');
    expect(component.borderRadius).toBe(4);
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
    component.label = 'Click Me';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Click Me');
  });

  it('should apply solid type class', () => {
    component.type = 'solid';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--solid');
  });

  it('should apply outlined type class', () => {
    component.type = 'outlined';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--outlined');
  });

  it('should apply borderless type class', () => {
    component.type = 'borderless';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--borderless');
  });

  it('should apply normal size class', () => {
    component.size = 'normal';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--normal');
  });

  it('should apply large size class', () => {
    component.size = 'large';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--large');
  });

  it('should apply small size class', () => {
    component.size = 'small';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--small');
  });

  it('should apply xsmall size class', () => {
    component.size = 'xsmall';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--xsmall');
  });

  it('should apply icon-before class when icon and label are present', () => {
    component.icon = 'home';
    component.label = 'Home';
    component.iconPosition = 'before';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).toContain('cps-button--icon-before');
  });

  it('should apply icon-after class when icon and label are present', () => {
    component.icon = 'home';
    component.label = 'Home';
    component.iconPosition = 'after';
    component.ngOnChanges();
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
    component.width = 200;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtWidth).toBe('200px');
  });

  it('should set custom width as string', () => {
    component.width = '50%';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtWidth).toBe('50%');
  });

  it('should set custom height', () => {
    component.height = 50;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtHeight).toBe('50px');
  });

  it('should calculate font size based on custom height', () => {
    component.height = 100;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtFontSize).toBe('40px');
  });

  it('should calculate icon size based on custom height', () => {
    component.height = 100;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtIconSize).toBe('40px');
  });

  it('should convert border radius from number to string', () => {
    component.borderRadius = 8;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.borderRadius).toBe('8px');
  });

  it('should keep border radius as string if already string', () => {
    component.borderRadius = '1rem';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.borderRadius).toBe('1rem');
  });

  it('should display loading indicator when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const loader = fixture.nativeElement.querySelector('cps-progress-circular');
    expect(loader).toBeTruthy();
  });

  it('should disable button when disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should render icon when icon is provided', () => {
    component.icon = 'home';
    component.label = 'Home';
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('cps-icon');
    expect(icon).toBeTruthy();
  });

  it('should set button color', () => {
    component.color = 'primary';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.buttonColor).toBeTruthy();
  });

  it('should set text color for solid type', () => {
    component.type = 'solid';
    component.contentColor = 'black';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.textColor).toBeTruthy();
  });

  it('should set text color to button color for outlined type', () => {
    component.type = 'outlined';
    component.color = 'primary';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.textColor).toBe(component.buttonColor);
  });

  it('should set text color to button color for borderless type', () => {
    component.type = 'borderless';
    component.color = 'primary';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.textColor).toBe(component.buttonColor);
  });

  it('should always have base class cps-button', () => {
    component.ngOnChanges();
    expect(component.classesList).toContain('cps-button');
  });

  it('should handle height with different units', () => {
    component.height = '5rem';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.cvtHeight).toBe('5rem');
    expect(component.cvtFontSize).toContain('rem');
    expect(component.cvtIconSize).toContain('rem');
  });

  it('should not apply icon position class if no icon', () => {
    component.label = 'Test';
    component.icon = '';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).not.toContain('cps-button--icon-before');
    expect(component.classesList).not.toContain('cps-button--icon-after');
  });

  it('should not apply icon position class if no label', () => {
    component.icon = 'home';
    component.label = '';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.classesList).not.toContain('cps-button--icon-before');
    expect(component.classesList).not.toContain('cps-button--icon-after');
  });
});
