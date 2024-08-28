import { TestBed } from '@angular/core/testing';
import { CpsAutocompleteComponent } from './cps-autocomplete.component';

describe('CpsAutocompleteComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsAutocompleteComponent]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(CpsAutocompleteComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
