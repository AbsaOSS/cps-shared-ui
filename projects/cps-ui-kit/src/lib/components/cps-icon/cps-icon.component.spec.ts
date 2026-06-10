import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { CpsIconComponent, ICONS_PATH } from './cps-icon.component';
import { CommonModule } from '@angular/common';

describe('CpsIconComponent', () => {
  const createComponent = () => {
    fixture = TestBed.createComponent(CpsIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  let component: CpsIconComponent;
  let fixture: ComponentFixture<CpsIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, CpsIconComponent]
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have aria-hidden="true" on the host by default (decorative)', () => {
      createComponent();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.getAttribute('role')).toBeNull();
      expect(host.getAttribute('aria-label')).toBeNull();
    });

    it('should expose role="img" and aria-label on the host when ariaLabel is set', () => {
      createComponent();
      component.ariaLabel = 'Warning icon';
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('role')).toBe('img');
      expect(host.getAttribute('aria-label')).toBe('Warning icon');
      expect(host.getAttribute('aria-hidden')).toBeNull();
    });

    it('should restore decorative state when ariaLabel is cleared', () => {
      createComponent();
      component.ariaLabel = 'Warning icon';
      fixture.detectChanges();
      component.ariaLabel = '';
      fixture.detectChanges();
      const host: HTMLElement = fixture.nativeElement;
      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.getAttribute('role')).toBeNull();
    });

    it('should always render the inner svg with aria-hidden="true"', () => {
      createComponent();
      component.icon = 'warning';
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Test assets path injection', () => {
    it('should use default path when no ICONS_PATH is provided', () => {
      createComponent();
      expect(component.url).toBe('assets/');
    });

    it('should use injected ICONS_PATH value', () => {
      TestBed.overrideProvider(ICONS_PATH, {
        useValue: 'test-assets/'
      });
      createComponent();
      expect(component.url).toBe('test-assets/');
    });
  });

  describe('ngOnInit', () => {
    it('should initialize iconColor and apply default size class', () => {
      createComponent();
      expect(component.iconColor).toBeDefined();
      expect(component.classesList).toContain('cps-icon');
      expect(component.classesList).toContain('cps-icon--small');
    });
  });

  describe('ngOnChanges', () => {
    it('should update iconColor when color input changes', () => {
      createComponent();
      const initialColor = component.iconColor;
      component.color = 'green';
      component.ngOnChanges({
        color: new SimpleChange('currentColor', 'green', false)
      });
      expect(component.iconColor).not.toBe(initialColor);
    });

    it('should update classesList when size input changes', () => {
      createComponent();
      component.size = 'large';
      component.ngOnChanges({
        size: new SimpleChange('small', 'large', false)
      });
      expect(component.classesList).toContain('cps-icon--large');
    });

    it('should not update classesList when only color changes', () => {
      createComponent();
      component.size = 'large';
      component.ngOnChanges({
        size: new SimpleChange('small', 'large', false)
      });
      const classesSnapshot = [...component.classesList];

      component.color = 'red';
      component.ngOnChanges({
        color: new SimpleChange('currentColor', 'red', false)
      });
      expect(component.classesList).toEqual(classesSnapshot);
    });
  });

  describe('setClasses', () => {
    it('should reset classesList on each call preventing class accumulation', () => {
      createComponent();
      component.size = 'large';
      component.setClasses();
      component.size = 'small';
      component.setClasses();
      expect(component.classesList).not.toContain('cps-icon--large');
      expect(component.classesList).toContain('cps-icon--small');
    });

    it.each([
      ['fill', 'cps-icon--fill'],
      ['xsmall', 'cps-icon--xsmall'],
      ['small', 'cps-icon--small'],
      ['normal', 'cps-icon--normal'],
      ['large', 'cps-icon--large']
    ] as const)('should add %s class for size "%s"', (size, expectedClass) => {
      createComponent();
      component.size = size;
      component.setClasses();
      expect(component.classesList).toContain(expectedClass);
      expect(component.classesList).toContain('cps-icon');
    });

    it('should set cvtSize for a custom numeric size', () => {
      createComponent();
      component.size = 24;
      component.setClasses();
      expect(component.cvtSize).toBeTruthy();
    });

    it('should reset cvtSize when switching from custom to a named size', () => {
      createComponent();
      component.size = 24;
      component.setClasses();
      component.size = 'small';
      component.setClasses();
      expect(component.cvtSize).toBe('');
    });
  });
});
