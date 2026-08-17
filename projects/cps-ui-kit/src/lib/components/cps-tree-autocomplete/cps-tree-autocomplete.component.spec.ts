import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick
} from '@angular/core/testing';
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

    it('should focus the input after a timeout in single mode', fakeAsync(() => {
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onSelectNode();
      expect(focusSpy).not.toHaveBeenCalled();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should not schedule a focus timeout in multiple mode', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onSelectNode();
      tick();
      expect(focusSpy).not.toHaveBeenCalled();
    }));
  });

  describe('onOuterDivKeyDown', () => {
    it('should ignore events not targeting the component container', () => {
      const containerKeyDownSpy = jest.spyOn(component, 'onContainerKeyDown');
      const event = new KeyboardEvent('keydown', { code: 'Tab' });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div')
      });
      component.onOuterDivKeyDown(event);
      expect(containerKeyDownSpy).not.toHaveBeenCalled();
    });

    it('should focus the input and delegate to onContainerKeyDown when targeting the container', () => {
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      const containerKeyDownSpy = jest
        .spyOn(component, 'onContainerKeyDown')
        .mockImplementation(() => {});
      const event = new KeyboardEvent('keydown', { code: 'Tab' });
      Object.defineProperty(event, 'target', {
        value: component.componentContainer.nativeElement
      });
      component.onOuterDivKeyDown(event);
      expect(focusSpy).toHaveBeenCalled();
      expect(containerKeyDownSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('onContainerKeyDown — dropdown already open', () => {
    function keyEvent(code: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { code, bubbles: true });
    }

    it('should navigate into options on ArrowDown without reopening', () => {
      component.toggleOptions(true);
      jest.spyOn(component, 'toggleOptions');
      const navigateSpy = jest
        .spyOn(component, 'navigateIntoOptions')
        .mockImplementation(() => {});
      component.onContainerKeyDown(keyEvent('ArrowDown'));
      expect(component.toggleOptions).not.toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(false);
    });

    it('should navigate into options on ArrowUp without reopening', () => {
      component.toggleOptions(true);
      const navigateSpy = jest
        .spyOn(component, 'navigateIntoOptions')
        .mockImplementation(() => {});
      component.onContainerKeyDown(keyEvent('ArrowUp'));
      expect(navigateSpy).toHaveBeenCalledWith(true);
    });

    it('should update treeContainerElement from the rendered tree when opening', fakeAsync(() => {
      const initSpy = jest
        .spyOn(component, 'initArrowsNavigaton')
        .mockImplementation(() => {});
      component.onContainerKeyDown(keyEvent('ArrowDown'));
      tick();
      expect(initSpy).toHaveBeenCalledWith(false);
      expect(
        component.treeContainerElement?.classList.contains(
          'p-tree-root-children'
        )
      ).toBe(true);
      discardPeriodicTasks();
    }));
  });

  describe('onInputKeyDown — Enter confirms input', () => {
    it('should confirm the typed input when open and nothing is focused', () => {
      component.toggleOptions(true);
      component.optionFocused = false;
      const input = document.createElement('input');
      input.value = 'Option 1';
      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      Object.defineProperty(event, 'target', { value: input });
      jest.spyOn(event, 'stopPropagation');
      component.onInputKeyDown(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not confirm input when an option is keyboard-focused', () => {
      component.toggleOptions(true);
      component.optionFocused = true;
      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      jest.spyOn(event, 'stopPropagation');
      component.onInputKeyDown(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('onFilterOptions', () => {
    it('should recalc the virtual list height', () => {
      const recalcSpy = jest.spyOn(component, 'recalcVirtualListHeight');
      component.onFilterOptions();
      expect(recalcSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should clear the input and focus after a timeout', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.treeSelection = [OPTIONS[0]];
      component.inputText = 'typed';
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.remove(OPTIONS[0] as any);
      expect(component.inputText).toBe('');
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));
  });

  describe('clear', () => {
    it('should clear the input and focus after a timeout', fakeAsync(() => {
      component.writeValue(OPTIONS[0]);
      component.inputText = 'typed';
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.clear();
      expect(component.inputText).toBe('');
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));
  });

  describe('_select (via selecting a node while dropdown is open)', () => {
    it('should add the option in multiple mode and clear input', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.treeSelection = [];
      (component as any)._select(OPTIONS[0]);
      expect(component.treeSelection).toContainEqual(OPTIONS[0]);
      expect(component.inputText).toBe('');
      tick();
      discardPeriodicTasks();
    }));

    it('should remove the option in multiple mode when already selected', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.treeSelection = [OPTIONS[0]];
      (component as any)._select(OPTIONS[0]);
      expect(component.treeSelection).not.toContainEqual(OPTIONS[0]);
      tick();
      discardPeriodicTasks();
    }));

    it('should replace the selection in single mode', fakeAsync(() => {
      (component as any)._select(OPTIONS[1]);
      expect(component.treeSelection).toEqual(OPTIONS[1]);
      tick();
      discardPeriodicTasks();
    }));
  });

  describe('_confirmInput (via onInputKeyDown Enter)', () => {
    function confirm(value: string) {
      const input = document.createElement('input');
      input.value = value;
      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      Object.defineProperty(event, 'target', { value: input });
      component.onInputKeyDown(event);
    }

    it('should do nothing when the dropdown is closed', () => {
      component.isOpened = false;
      expect(() => confirm('anything')).not.toThrow();
    });

    it('should clear the selection in single mode when confirming empty input', () => {
      component.toggleOptions(true);
      component.writeValue(OPTIONS[0]);
      confirm('');
      expect(component.treeSelection).toBeUndefined();
    });

    it('should do nothing when confirming empty input in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.toggleOptions(true);
      component.treeSelection = [OPTIONS[0]];
      confirm('');
      expect(component.treeSelection).toEqual([OPTIONS[0]]);
    });

    it('should select the option matching the typed label', fakeAsync(() => {
      component.toggleOptions(true);
      (component.treeList as any).serializedValue = [
        { node: OPTIONS[0] },
        { node: OPTIONS[1] }
      ];
      confirm('option 2');
      expect(component.treeSelection).toEqual(OPTIONS[1]);
      tick();
      discardPeriodicTasks();
    }));

    it('should restore the current label when no option matches in single mode', () => {
      component.toggleOptions(true);
      component.writeValue(OPTIONS[0]);
      (component.treeList as any).serializedValue = [];
      confirm('nonexistent');
      expect(component.inputText).toBe('Option 1');
    });
  });

  describe('_removeLastValue (via Backspace)', () => {
    function backspace() {
      const event = new KeyboardEvent('keydown', { code: 'Backspace' });
      component.onInputKeyDown(event);
    }

    it('should do nothing in single mode', () => {
      fixture.componentRef.setInput('multiple', false);
      expect(() => backspace()).not.toThrow();
      expect(component.backspaceClickedOnce).toBe(false);
    });

    it('should do nothing when inputText is not empty', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = 'typed';
      backspace();
      expect(component.backspaceClickedOnce).toBe(false);
    });

    it('should arm backspaceClickedOnce on first press with a selection', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = '';
      component.treeSelection = [OPTIONS[0], OPTIONS[1]];
      backspace();
      expect(component.backspaceClickedOnce).toBe(true);
    });

    it('should remove the last selected value on second press', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = '';
      component.treeSelection = [OPTIONS[0], OPTIONS[1]];
      backspace();
      backspace();
      expect(component.treeSelection).toEqual([OPTIONS[0]]);
      expect(component.backspaceClickedOnce).toBe(false);
      tick();
      discardPeriodicTasks();
    }));

    it('should not arm backspaceClickedOnce when there is no selection', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = '';
      component.treeSelection = [];
      backspace();
      expect(component.backspaceClickedOnce).toBe(false);
    });
  });

  describe('onBoxClick edge cases', () => {
    it('should skip single-mode bookkeeping in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.inputText = '';
      component.onBoxClick();
      expect(component.activeSingle).toBe(false);
      expect(component.inputText).toBe('');
    });

    it('should not overwrite inputText when already set', () => {
      component.inputText = 'already typed';
      component.onBoxClick();
      expect(component.inputText).toBe('already typed');
    });

    it('should not reset the tree filter when already open', () => {
      component.toggleOptions(true);
      (component.treeList.resetFilter as jest.Mock).mockClear();
      component.onBoxClick();
      expect(component.treeList.resetFilter).not.toHaveBeenCalled();
    });
  });

  describe('onContainerKeyDown with an unrelated key', () => {
    it('should do nothing for a key that is not Tab/Escape/ArrowDown/ArrowUp', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyA' });
      jest.spyOn(component, 'toggleOptions');
      expect(() => component.onContainerKeyDown(event)).not.toThrow();
      expect(component.toggleOptions).not.toHaveBeenCalled();
    });
  });

  describe('onContainerKeyDown tree container lookup', () => {
    it('should leave treeContainerElement unchanged when no matching element is found (opening)', fakeAsync(() => {
      const previous = component.treeContainerElement;
      (component.treeList as any).el = {
        nativeElement: document.createElement('div')
      };
      const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
      component.onContainerKeyDown(event);
      tick();
      expect(component.treeContainerElement).toBe(previous);
      discardPeriodicTasks();
    }));

    it('should leave treeContainerElement unchanged when no matching element is found (already open)', () => {
      component.toggleOptions(true);
      (component.treeList as any).el = {
        nativeElement: document.createElement('div')
      };
      const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
      expect(() => component.onContainerKeyDown(event)).not.toThrow();
    });
  });

  describe('onInputKeyDown with an unrelated key', () => {
    it('should do nothing for a key that is not Backspace/Enter/NumpadEnter', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyA' });
      jest.spyOn(event, 'stopPropagation');
      component.onInputKeyDown(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('onContainerMouseDown when already focused', () => {
    it('should not refocus when the input is already the active element', () => {
      const input = component.treeAutocompleteInput.nativeElement;
      document.body.appendChild(input);
      input.focus();
      const focusSpy = jest.spyOn(component, 'focusInput');
      const event = new MouseEvent('mousedown');
      Object.defineProperty(event, 'target', { value: input });
      component.onContainerMouseDown(event);
      expect(focusSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });
  });

  describe('filterOptions when already open', () => {
    it('should not toggle options again when already open', () => {
      component.toggleOptions(true);
      jest.spyOn(component, 'toggleOptions');
      component.filterOptions({ target: { value: 'a' } });
      expect(component.toggleOptions).not.toHaveBeenCalled();
    });
  });

  describe('_confirmInput direct calls', () => {
    it('should return immediately when the dropdown is closed', () => {
      component.isOpened = false;
      jest.spyOn(component, 'toggleOptions');
      (component as any)._confirmInput('anything');
      expect(component.toggleOptions).not.toHaveBeenCalled();
    });

    it('should keep filtering without closing when no match is found in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.toggleOptions(true);
      (component.treeList as any).serializedValue = [];
      jest.spyOn(component.treeList, 'resetFilter').mockClear();
      (component as any)._confirmInput('nonexistent');
      expect(component.treeList.resetFilter).toHaveBeenCalled();
    });
  });

  describe('multi-select display (track expression / NG0956 regression)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('multiple', true);
    });

    it('should render chip labels for real tree selections', () => {
      fixture.componentRef.setInput('chips', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const chipLabels = fixture.debugElement
        .queryAll(By.css('cps-chip'))
        .map((el) => el.componentInstance.label);
      expect(chipLabels).toEqual(['Option 1', 'Option 2']);
    });

    it('should render text-group labels for real tree selections when chips is disabled', () => {
      fixture.componentRef.setInput('chips', false);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.text-group-item'));
      expect(items.map((el) => el.nativeElement.textContent.trim())).toEqual([
        'Option 1,',
        'Option 2'
      ]);
    });

    it('should not warn when re-selecting a different but overlapping set of nodes (chips)', () => {
      fixture.componentRef.setInput('chips', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      component.writeValue([OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/NG0956|NG0955/)
      );
      warnSpy.mockRestore();

      const chipLabels = fixture.debugElement
        .queryAll(By.css('cps-chip'))
        .map((el) => el.componentInstance.label);
      expect(chipLabels).toEqual(['Option 2']);
    });

    it('should keep sibling/cross-branch node keys unique in a nested tree with multiple selected nodes', () => {
      fixture.componentRef.setInput('chips', true);
      const parentChildren = OPTIONS[2].children as unknown as typeof OPTIONS;
      component.writeValue([parentChildren[0], parentChildren[1]]);
      fixture.changeDetectorRef.markForCheck();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/NG0956|NG0955/)
      );
      warnSpy.mockRestore();

      const chipLabels = fixture.debugElement
        .queryAll(By.css('cps-chip'))
        .map((el) => el.componentInstance.label);
      expect(chipLabels).toEqual(['Child 1', 'Child 2']);
    });
  });
});
