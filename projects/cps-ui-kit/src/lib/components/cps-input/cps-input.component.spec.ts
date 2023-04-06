import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpsInputComponent } from './cps-input.component';

describe('CpsInputComponent', () => {
  let component: CpsInputComponent;
  let fixture: ComponentFixture<CpsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CpsInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CpsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
