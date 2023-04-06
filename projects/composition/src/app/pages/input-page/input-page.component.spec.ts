import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputPageComponent } from './input-page.component';

describe('InputPageComponent', () => {
  let component: InputPageComponent;
  let fixture: ComponentFixture<InputPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
