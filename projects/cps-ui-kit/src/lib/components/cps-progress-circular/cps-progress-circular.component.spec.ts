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
    expect(component.diameter).toBe('2.5rem');
    expect(component.strokeWidth).toBe('0.25rem');
    expect(component.color).toBeTruthy();
  });

  it('should convert numeric diameter on init', () => {
    component.diameter = 50;
    component.ngOnInit();
    expect(component.cvtDiameter).toBe('50px');
  });

  it('should keep string diameter as-is on init', () => {
    component.diameter = '2rem';
    component.ngOnInit();
    expect(component.cvtDiameter).toBe('2rem');
  });

  it('should convert numeric strokeWidth on init', () => {
    component.strokeWidth = 5;
    component.ngOnInit();
    expect(component.cvtStrokeWidth).toBe('5px');
  });

  it('should keep string strokeWidth as-is on init', () => {
    component.strokeWidth = '0.5rem';
    component.ngOnInit();
    expect(component.cvtStrokeWidth).toBe('0.5rem');
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

  describe('Accessibility (aria-label)', () => {
    it('should default aria-label to "Loading" when no label is provided', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-label')).toBe('Loading');
    });

    it('should set aria-label from the ariaLabel input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Saving changes');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-label')).toBe('Saving changes');
    });

    it('should update aria-label when ariaLabel input changes', () => {
      fixture.componentRef.setInput('ariaLabel', 'Saving changes');
      fixture.detectChanges();
      fixture.componentRef.setInput('ariaLabel', 'Uploading file');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-label')).toBe('Uploading file');
    });

    it('should fall back to "Loading" when ariaLabel is cleared', () => {
      fixture.componentRef.setInput('ariaLabel', 'Saving changes');
      fixture.detectChanges();
      fixture.componentRef.setInput('ariaLabel', '');
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-label')).toBe('Loading');
    });

    it('should have role="progressbar" on the host', () => {
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('role')).toBe('progressbar');
    });
  });
});
