import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsProgressCircularComponent } from './cps-progress-circular.component';

describe('CpsProgressCircularComponent', () => {
  let component: CpsProgressCircularComponent;
  let fixture: ComponentFixture<CpsProgressCircularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsProgressCircularComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsProgressCircularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.diameter).toBe('40px');
    expect(component.strokeWidth).toBe('4px');
    expect(component.color).toBeTruthy();
  });

  it('should convert diameter on init', () => {
    component.diameter = 50;
    component.ngOnInit();
    expect(component.diameter).toBe('50px');
  });

  it('should keep diameter as string if already string', () => {
    component.diameter = '2rem';
    component.ngOnInit();
    expect(component.diameter).toBe('2rem');
  });

  it('should convert strokeWidth on init', () => {
    component.strokeWidth = 5;
    component.ngOnInit();
    expect(component.strokeWidth).toBe('5px');
  });

  it('should keep strokeWidth as string if already string', () => {
    component.strokeWidth = '0.5rem';
    component.ngOnInit();
    expect(component.strokeWidth).toBe('0.5rem');
  });

  it('should set custom color', () => {
    component.color = 'primary';
    component.ngOnInit();
    expect(component.color).toBeTruthy();
  });

  it('should display SVG circle', () => {
    const circle = fixture.nativeElement.querySelector(
      '.cps-progress-circular'
    );
    expect(circle).toBeTruthy();
  });
});
