import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationSidebarComponent } from './navigation-sidebar.component';

describe('NavigationSidebarComponent', () => {
  let component: NavigationSidebarComponent;
  let fixture: ComponentFixture<NavigationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigationSidebarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
