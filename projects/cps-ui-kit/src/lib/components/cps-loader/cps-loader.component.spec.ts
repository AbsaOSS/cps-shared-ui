import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsLoaderComponent } from './cps-loader.component';

describe('CpsLoaderComponent', () => {
  let component: CpsLoaderComponent;
  let fixture: ComponentFixture<CpsLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsLoaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.fullScreen).toBe(false);
    expect(component.opacity).toBe(0.1);
    expect(component.labelColor).toBeTruthy();
    expect(component.showLabel).toBe(true);
  });

  it('should display loading label by default', () => {
    const label = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-text'
    );
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Loading...');
  });

  it('should hide loading label when showLabel is false', () => {
    component.showLabel = false;
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-text'
    );
    expect(label).toBeFalsy();
  });

  it('should apply fullScreen styling when fullScreen is true', () => {
    component.fullScreen = true;
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.cps-loader-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should set background color with custom opacity', () => {
    component.opacity = 0.5;
    component.ngOnInit();
    expect(component.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('should convert label color on init', () => {
    component.labelColor = 'primary';
    component.ngOnInit();
    expect(component.labelColor).toBeTruthy();
  });

  it('should display spinner', () => {
    const spinner = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-circles'
    );
    expect(spinner).toBeTruthy();
  });

  it('should have correct default opacity', () => {
    expect(component.backgroundColor).toContain('0.1');
  });
});
