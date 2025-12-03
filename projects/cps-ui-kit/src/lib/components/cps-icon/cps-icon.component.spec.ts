import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      imports: [CommonModule, CpsIconComponent],
      providers: [{ provide: ICONS_PATH, useValue: 'test-assets' }]
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('Test assets path injection', () => {
    it('should use injected ICONS_PATH value', () => {
      createComponent();
      expect(component.url).toBe('test-assets');
    });

    it('should default to "assets/" if no ICONS_PATH is provided', () => {
      TestBed.overrideProvider(ICONS_PATH, {
        useValue: null
      });
      createComponent();
      expect(component.url).toBe('assets/');
    });
  });
});
