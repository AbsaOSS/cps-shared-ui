import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CpsIconComponent } from 'cps-ui-kit';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';

jest.mock('projects/cps-ui-kit/package.json', () => ({ version: '1.0.0' }), {
  virtual: true
});

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [NavigationSidebarComponent, CpsIconComponent, RouterOutlet],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
