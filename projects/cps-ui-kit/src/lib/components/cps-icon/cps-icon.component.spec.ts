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
      imports: [CommonModule, CpsIconComponent]
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
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
});
