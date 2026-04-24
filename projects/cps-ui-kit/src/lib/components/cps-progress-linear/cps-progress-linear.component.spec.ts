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
    expect(component.width()).toBe('100%');
    expect(component.height()).toBe('0.5rem');
    expect(component.color()).toBeTruthy();
    expect(component.bgColor()).toBeTruthy();
    expect(component.opacity()).toBe(1);
    expect(component.cvtRadius()).toBe('0px');
  });

  it('should convert width to px', () => {
    fixture.componentRef.setInput('width', 200);
    fixture.detectChanges();
    expect(component.cvtWidth()).toBe('200px');
  });

  it('should keep width as string if already string', () => {
    fixture.componentRef.setInput('width', '50%');
    fixture.detectChanges();
    expect(component.cvtWidth()).toBe('50%');
  });

  it('should convert height to px', () => {
    fixture.componentRef.setInput('height', 10);
    fixture.detectChanges();
    expect(component.cvtHeight()).toBe('10px');
  });

  it('should keep height as string if already string', () => {
    fixture.componentRef.setInput('height', '1rem');
    fixture.detectChanges();
    expect(component.cvtHeight()).toBe('1rem');
  });

  it('should convert radius to px', () => {
    fixture.componentRef.setInput('radius', 4);
    fixture.detectChanges();
    expect(component.cvtRadius()).toBe('4px');
  });

  it('should keep radius as string if already string', () => {
    fixture.componentRef.setInput('radius', '0.25rem');
    fixture.detectChanges();
    expect(component.cvtRadius()).toBe('0.25rem');
  });

  it('should set custom color', () => {
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    expect(component.cssColor()).toBeTruthy();
  });

  it('should set custom background color', () => {
    fixture.componentRef.setInput('bgColor', 'line-light');
    fixture.detectChanges();
    expect(component.cssBgColor()).toBeTruthy();
  });

  it('should set custom opacity', () => {
    fixture.componentRef.setInput('opacity', 0.5);
    fixture.detectChanges();
    expect(component.opacity()).toBe(0.5);
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
