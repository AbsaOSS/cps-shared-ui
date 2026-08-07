import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels/combine-labels.pipe';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsTreeSelectComponent } from './cps-tree-select.component';

const mockFontSize = signal(16);
const mockRootFontSizeService = {
  fontSize: mockFontSize.asReadonly()
};

const OPTIONS = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' }
];

describe('CpsTreeSelectComponent', () => {
  let component: CpsTreeSelectComponent;
  let fixture: ComponentFixture<CpsTreeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CpsTreeSelectComponent,
        NoopAnimationsModule
      ],
      providers: [
        CombineLabelsPipe,
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsTreeSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test tree select');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.detectChanges();

    let menuVisible = false;
    const menu = component.optionsMenu;
    jest.spyOn(menu, 'show').mockImplementation(() => {
      menuVisible = true;
    });
    jest.spyOn(menu, 'hide').mockImplementation(() => {
      menuVisible = false;
    });
    jest.spyOn(menu, 'toggle').mockImplementation(() => {
      menuVisible = !menuVisible;
    });
    jest.spyOn(menu, 'isVisible').mockImplementation(() => menuVisible);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Display', () => {
    it('should apply underlined appearance class', () => {
      fixture.componentRef.setInput('appearance', 'underlined');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-treeselect-container.underlined')
      );
      expect(container).toBeTruthy();
    });

    it('should apply borderless appearance class', () => {
      fixture.componentRef.setInput('appearance', 'borderless');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-treeselect-container.borderless')
      );
      expect(container).toBeTruthy();
    });

    it('should display placeholder when no value is selected', () => {
      fixture.componentRef.setInput('placeholder', 'Choose an option');
      component.writeValue(undefined);
      fixture.detectChanges();
      const placeholder = fixture.debugElement.query(
        By.css('.cps-treeselect-box-placeholder')
      );
      expect(placeholder.nativeElement.textContent.trim()).toBe(
        'Choose an option'
      );
    });
  });

  describe('onBoxClick', () => {
    it('should toggle the dropdown', () => {
      expect(component.isOpened).toBe(false);
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
    });

    it('should call stopPropagation when an event is passed', () => {
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');
      component.onBoxClick(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should close the dropdown on second call', () => {
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
      component.onBoxClick();
      expect(component.isOpened).toBe(false);
    });
  });

  describe('onBeforeOptionsHidden', () => {
    it('should close the dropdown', () => {
      component.toggleOptions(true);
      expect(component.isOpened).toBe(true);
      component.onBeforeOptionsHidden();
      expect(component.isOpened).toBe(false);
    });
  });

  describe('onKeyDown', () => {
    function keyEvent(code: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { code, bubbles: true });
    }

    it('should close dropdown on Tab when open', () => {
      component.toggleOptions(true);
      component.onKeyDown(keyEvent('Tab'));
      expect(component.isOpened).toBe(false);
    });

    it('should not call preventDefault on Tab', () => {
      component.toggleOptions(true);
      const event = keyEvent('Tab');
      jest.spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should close dropdown and call preventDefault on Escape', () => {
      component.toggleOptions(true);
      const event = keyEvent('Escape');
      jest.spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(component.isOpened).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should toggle dropdown on Enter and also open on Space and NumpadEnter', () => {
      component.onKeyDown(keyEvent('Enter'));
      expect(component.isOpened).toBe(true);
      component.onKeyDown(keyEvent('Enter'));
      expect(component.isOpened).toBe(false);

      component.onKeyDown(keyEvent('Space'));
      expect(component.isOpened).toBe(true);
      component.toggleOptions(false);

      component.onKeyDown(keyEvent('NumpadEnter'));
      expect(component.isOpened).toBe(true);
    });

    it('should open dropdown and call preventDefault on arrow keys', () => {
      const event = keyEvent('ArrowDown');
      jest.spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(component.isOpened).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();

      component.toggleOptions(false);
      component.onKeyDown(keyEvent('ArrowUp'));
      expect(component.isOpened).toBe(true);
    });
  });
});
