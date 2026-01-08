import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsProgressLinearComponent } from './cps-progress-linear.component';

describe('CpsProgressLinearComponent', () => {
  let component: CpsProgressLinearComponent;
  let fixture: ComponentFixture<CpsProgressLinearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsProgressLinearComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsProgressLinearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.width).toBe('100%');
    expect(component.height).toBe('0.5rem');
    expect(component.color).toBeTruthy();
    expect(component.bgColor).toBeTruthy();
    expect(component.opacity).toBe(1);
    expect(component.radius).toBe('0px');
  });

  it('should convert width on init', () => {
    component.width = 200;
    component.ngOnInit();
    expect(component.width).toBe('200px');
  });

  it('should keep width as string if already string', () => {
    component.width = '50%';
    component.ngOnInit();
    expect(component.width).toBe('50%');
  });

  it('should convert height on init', () => {
    component.height = 10;
    component.ngOnInit();
    expect(component.height).toBe('10px');
  });

  it('should keep height as string if already string', () => {
    component.height = '1rem';
    component.ngOnInit();
    expect(component.height).toBe('1rem');
  });

  it('should convert radius on init', () => {
    component.radius = 4;
    component.ngOnInit();
    expect(component.radius).toBe('4px');
  });

  it('should keep radius as string if already string', () => {
    component.radius = '0.25rem';
    component.ngOnInit();
    expect(component.radius).toBe('0.25rem');
  });

  it('should set custom color', () => {
    component.color = 'primary';
    component.ngOnInit();
    expect(component.color).toBeTruthy();
  });

  it('should set custom background color', () => {
    component.bgColor = 'line-light';
    component.ngOnInit();
    expect(component.bgColor).toBeTruthy();
  });

  it('should set custom opacity', () => {
    component.opacity = 0.5;
    fixture.detectChanges();
    expect(component.opacity).toBe(0.5);
  });

  it('should display progress bar', () => {
    const progressBar = fixture.nativeElement.querySelector(
      '.cps-progress-linear'
    );
    expect(progressBar).toBeTruthy();
  });

  it('should display progress indicator', () => {
    const indicator = fixture.nativeElement.querySelector(
      '.cps-progress-linear-line'
    );
    expect(indicator).toBeTruthy();
  });
});
