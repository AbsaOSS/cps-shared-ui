import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsMenuHideReason } from '../cps-menu/cps-menu.component';
import { CpsTreeAutocompleteComponent } from './cps-tree-autocomplete.component';

const mockFontSize = signal(16);
const mockRootFontSizeService = {
  fontSize: mockFontSize.asReadonly()
};

const OPTIONS = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  {
    label: 'Parent',
    value: 'parent',
    children: [
      { label: 'Child 1', value: 'child1' },
      { label: 'Child 2', value: 'child2' }
    ]
  }
];

describe('CpsTreeAutocompleteComponent', () => {
  let component: CpsTreeAutocompleteComponent;
  let fixture: ComponentFixture<CpsTreeAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CpsTreeAutocompleteComponent,
        NoopAnimationsModule
      ],
      providers: [
        {
          provide: CPS_ROOT_FONT_SIZE_SERVICE,
          useValue: mockRootFontSizeService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsTreeAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test tree autocomplete');
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

    jest.spyOn(component.treeList, 'resetFilter').mockImplementation(() => {});
    jest
      .spyOn(component.treeList as any, '_filter')
      .mockImplementation(() => {});
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Display', () => {
    it('should apply underlined appearance class', () => {
      fixture.componentRef.setInput('appearance', 'underlined');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-treeautocomplete-container.underlined')
      );
      expect(container).toBeTruthy();
    });

    it('should apply borderless appearance class', () => {
      fixture.componentRef.setInput('appearance', 'borderless');
      fixture.detectChanges();
      const container = fixture.debugElement.query(
        By.css('.cps-treeautocomplete-container.borderless')
      );
      expect(container).toBeTruthy();
    });

    it('should show placeholder when no value is selected', () => {
      fixture.componentRef.setInput('placeholder', 'Search here');
      component.treeSelection = undefined;
      fixture.detectChanges();
      const input = fixture.debugElement.query(
        By.css('input.cps-treeautocomplete-box-input')
      );
      expect(input.nativeElement.placeholder).toBe('Search here');
    });
  });

  describe('isActive()', () => {
    it('should return true when dropdown is open', () => {
      component.toggleOptions(true);
      expect(component.isActive()).toBe(true);
    });

    it('should return false when dropdown is closed and input is not focused', () => {
      expect(component.isActive()).toBe(false);
    });
  });

  describe('onChevronClick', () => {
    it('should call event.preventDefault()', () => {
      const event = new MouseEvent('mousedown');
      jest.spyOn(event, 'preventDefault');
      component.onChevronClick(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should open the dropdown when closed', () => {
      const event = new MouseEvent('mousedown');
      jest.spyOn(event, 'preventDefault');
      component.onChevronClick(event);
      expect(component.isOpened).toBe(true);
    });

    it('should close the dropdown and clear input when open', () => {
      component.toggleOptions(true);
      component.inputText = 'typed value';
      const event = new MouseEvent('mousedown');
      jest.spyOn(event, 'preventDefault');
      component.onChevronClick(event);
      expect(component.isOpened).toBe(false);
      expect(component.inputText).toBe('');
    });
  });

  describe('onContainerMouseDown', () => {
    it('should call event.preventDefault() when target is not the input', () => {
      const event = new MouseEvent('mousedown');
      Object.defineProperty(event, 'target', {
        value: document.createElement('div')
      });
      jest.spyOn(event, 'preventDefault');
      component.onContainerMouseDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should NOT call event.preventDefault() when target is the input element', () => {
      const inputEl = component.treeAutocompleteInput.nativeElement;
      const event = new MouseEvent('mousedown');
      Object.defineProperty(event, 'target', { value: inputEl });
      jest.spyOn(event, 'preventDefault');
      component.onContainerMouseDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onFocus', () => {
    it('should set activeSingle to true in single mode', () => {
      component.onFocus();
      expect(component.activeSingle).toBe(true);
    });

    it('should NOT set activeSingle in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.onFocus();
      expect(component.activeSingle).toBe(false);
    });

    it('should set isKeyboardFocused to true when not preceded by a mouse click', () => {
      component.onFocus();
      expect(component.isKeyboardFocused).toBe(true);
    });

    it('should populate inputText from selection label in single mode when input is empty', () => {
      component.writeValue(OPTIONS[0]);
      component.inputText = '';
      component.onFocus();
      expect(component.inputText).toBe('Option 1');
    });
  });

  describe('onBlur', () => {
    it('should reset isKeyboardFocused to false', () => {
      component.isKeyboardFocused = true;
      component.onBlur();
      expect(component.isKeyboardFocused).toBe(false);
    });

    it('should clear inputText when dropdown is closed', () => {
      component.inputText = 'some text';
      component.onBlur();
      expect(component.inputText).toBe('');
    });

    it('should not clear inputText when dropdown is open', () => {
      component.toggleOptions(true);
      component.inputText = 'some text';
      component.onBlur();
      expect(component.inputText).toBe('some text');
    });
  });

  describe('onBeforeOptionsHidden', () => {
    it('should close the dropdown but preserve inputText on SCROLL or RESIZE', () => {
      for (const reason of [
        CpsMenuHideReason.SCROLL,
        CpsMenuHideReason.RESIZE
      ]) {
        component.toggleOptions(true);
        component.inputText = 'typed';
        component.onBeforeOptionsHidden(reason);
        expect(component.isOpened).toBe(false);
        expect(component.inputText).toBe('typed');
      }
    });

    it('should clear inputText on reasons other than SCROLL/RESIZE', () => {
      component.toggleOptions(true);
      component.inputText = 'typed';
      component.onBeforeOptionsHidden(CpsMenuHideReason.CLICK_OUTSIDE);
      expect(component.inputText).toBe('');
    });
  });

  describe('onBoxClick', () => {
    it('should set activeSingle to true in single mode', () => {
      component.onBoxClick();
      expect(component.activeSingle).toBe(true);
    });

    it('should open the dropdown', () => {
      component.onBoxClick();
      expect(component.isOpened).toBe(true);
    });

    it('should populate inputText from selection in single mode when empty', () => {
      component.writeValue(OPTIONS[0]);
      component.inputText = '';
      component.onBoxClick();
      expect(component.inputText).toBe('Option 1');
    });
  });

  describe('onContainerKeyDown', () => {
    function keyEvent(code: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { code, bubbles: true });
    }

    it('should close and clear on Tab when dropdown is open', () => {
      component.toggleOptions(true);
      component.inputText = 'typed';
      component.onContainerKeyDown(keyEvent('Tab'));
      expect(component.isOpened).toBe(false);
      expect(component.inputText).toBe('');
    });

    it('should do nothing on Tab when dropdown is already closed', () => {
      jest.spyOn(component, 'toggleOptions');
      component.onContainerKeyDown(keyEvent('Tab'));
      expect(component.toggleOptions).not.toHaveBeenCalled();
    });

    it('should close and clear on Escape', () => {
      component.toggleOptions(true);
      component.inputText = 'typed';
      component.onContainerKeyDown(keyEvent('Escape'));
      expect(component.isOpened).toBe(false);
      expect(component.inputText).toBe('');
    });

    it('should open dropdown, set isKeyboardFocused, and call preventDefault on arrow keys', () => {
      const event = keyEvent('ArrowDown');
      jest.spyOn(event, 'preventDefault');
      component.onContainerKeyDown(event);
      expect(component.isOpened).toBe(true);
      expect(component.isKeyboardFocused).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();

      component.toggleOptions(false);
      component.isKeyboardFocused = false;
      component.onContainerKeyDown(keyEvent('ArrowUp'));
      expect(component.isOpened).toBe(true);
      expect(component.isKeyboardFocused).toBe(true);
    });
  });

  describe('onInputKeyDown', () => {
    function keyEvent(code: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { code, bubbles: true });
    }

    it('should call event.stopPropagation() on Backspace', () => {
      const event = keyEvent('Backspace');
      jest.spyOn(event, 'stopPropagation');
      component.onInputKeyDown(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should open dropdown on Enter when closed', () => {
      const event = keyEvent('Enter');
      jest.spyOn(event, 'preventDefault');
      component.onInputKeyDown(event);
      expect(component.isOpened).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should open dropdown on NumpadEnter when closed', () => {
      component.onInputKeyDown(keyEvent('NumpadEnter'));
      expect(component.isOpened).toBe(true);
    });
  });

  describe('filterOptions', () => {
    it('should open the dropdown when not already open', () => {
      expect(component.isOpened).toBe(false);
      component.filterOptions({ target: { value: 'opt' } });
      expect(component.isOpened).toBe(true);
    });

    it('should call treeList.resetFilter when search value is empty', () => {
      component.filterOptions({ target: { value: '' } });
      expect(component.treeList.resetFilter).toHaveBeenCalled();
    });

    it('should call treeList._filter with lowercased search value', () => {
      component.filterOptions({ target: { value: 'Option' } });
      expect((component.treeList as any)._filter).toHaveBeenCalledWith(
        'option'
      );
    });

    it('should reset backspaceClickedOnce to false', () => {
      component.backspaceClickedOnce = true;
      component.filterOptions({ target: { value: '' } });
      expect(component.backspaceClickedOnce).toBe(false);
    });
  });

  describe('onSelectNode', () => {
    it('should reset backspaceClickedOnce', () => {
      component.backspaceClickedOnce = true;
      component.onSelectNode();
      expect(component.backspaceClickedOnce).toBe(false);
    });

    it('should clear inputText', () => {
      component.inputText = 'typed';
      component.onSelectNode();
      expect(component.inputText).toBe('');
    });

    it('should close dropdown in single mode after selection', () => {
      component.toggleOptions(true);
      component.onSelectNode();
      expect(component.isOpened).toBe(false);
    });
  });
});
