import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpsIconComponent } from './cps-icon.component';

describe('CpsIconComponent', () => {
  let component: CpsIconComponent;
  let fixture: ComponentFixture<CpsIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CpsIconComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CpsIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
