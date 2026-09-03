import {
  ChangeDetectionStrategy,
  Component,
  NO_ERRORS_SCHEMA,
  signal
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CombineLabelsPipe } from '../../../pipes/internal/combine-labels/combine-labels.pipe';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../services/cps-root-font-size/cps-root-font-size.service';
import { CpsTreeSelectComponent } from '../../cps-tree-select/cps-tree-select.component';

// Tests use CpsTreeSelectComponent as the concrete implementation of the abstract base class.

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

describe('CpsBaseTreeDropdownComponent', () => {
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

  describe('treeNodeToggleButtonPt', () => {
    it('should expose the aria-label PT structure for toggle buttons', () => {
      expect(component.treeNodeToggleButtonPt).toEqual({
        nodeToggleButton: { 'aria-label': 'Toggle node' }
      });
    });
  });

  describe('Display', () => {
    it('should display the label when provided', () => {
      fixture.componentRef.setInput('label', 'My Label');
      fixture.detectChanges();
      const label = fixture.debugElement.query(
        By.css('.cps-treeselect-label label')
      );
      expect(label.nativeElement.textContent.trim()).toBe('My Label');
    });

    it('should not render the label element when label is empty', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.cps-treeselect-label'));
      expect(label).toBeNull();
    });

    it('should display single selected option label', () => {
      component.writeValue(OPTIONS[0]);
      fixture.detectChanges();
      const singleItem = fixture.debugElement.query(By.css('.single-item'));
      expect(singleItem.nativeElement.textContent.trim()).toBe('Option 1');
    });

    it('should display hint text', () => {
      fixture.componentRef.setInput('hint', 'Some hint');
      fixture.detectChanges();
      const hint = fixture.debugElement.query(By.css('.cps-treeselect-hint'));
      expect(hint.nativeElement.textContent.trim()).toBe('Some hint');
    });

    it('should hide hint when hideDetails is true', () => {
      fixture.componentRef.setInput('hint', 'Some hint');
      fixture.componentRef.setInput('hideDetails', true);
      fixture.detectChanges();
      const hint = fixture.debugElement.query(By.css('.cps-treeselect-hint'));
      expect(hint).toBeNull();
    });

    it('should apply disabled class when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(
        By.css('.cps-treeselect.disabled')
      );
      expect(wrapper).toBeTruthy();
    });

    it('should apply error class when error is set', () => {
      component.error = 'Something went wrong';
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(
        By.css('.cps-treeselect.error')
      );
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Initialization', () => {
    it('should generate non-empty hintId, errorId, and optionsTreeId', () => {
      expect(component.hintId).toBeTruthy();
      expect(component.errorId).toBeTruthy();
      expect(component.optionsTreeId).toBeTruthy();
    });

    it('should initialise value as empty array in multiple mode when no value provided', () => {
      fixture.componentRef.setInput('multiple', true);
      component.ngOnInit();
      expect(Array.isArray(component.value)).toBe(true);
      expect(component.value).toHaveLength(0);
    });

    it('should convert numeric width to pixel string', () => {
      fixture.componentRef.setInput('width', 320);
      component.ngOnChanges({
        width: {
          currentValue: 320,
          previousValue: '100%',
          firstChange: false,
          isFirstChange: () => false
        }
      } as any);
      expect(component.cvtWidth).toBe('320px');
    });
  });

  describe('Options Processing', () => {
    it('should populate innerOptions from options input', () => {
      expect(component.innerOptions).toHaveLength(3);
    });

    it('should map option labels to innerOptions', () => {
      expect(component.innerOptions[0].label).toBe('Option 1');
      expect(component.innerOptions[1].label).toBe('Option 2');
      expect(component.innerOptions[2].label).toBe('Parent');
    });

    it('should nest children inside parent innerOptions', () => {
      const parent = component.innerOptions[2];
      expect(parent.children).toHaveLength(2);
      expect(parent.children![0].label).toBe('Child 1');
      expect(parent.children![1].label).toBe('Child 2');
    });

    it('should expand all parent nodes when initialExpandAll is true', () => {
      fixture.componentRef.setInput('initialExpandAll', true);
      fixture.componentRef.setInput('options', [...OPTIONS]);
      fixture.detectChanges();
      expect(component.innerOptions[2].expanded).toBe(true);
    });

    it('should update innerOptions when options input changes', () => {
      const newOptions = [{ label: 'New', value: 'new' }];
      fixture.componentRef.setInput('options', newOptions);
      fixture.detectChanges();
      expect(component.innerOptions).toHaveLength(1);
      expect(component.innerOptions[0].label).toBe('New');
    });
  });

  describe('Value Handling', () => {
    it('should store the value via writeValue', () => {
      component.writeValue(OPTIONS[0]);
      expect(component.value).toEqual(OPTIONS[0]);
    });

    it('should resolve treeSelection when writeValue is called with a known option', () => {
      component.writeValue(OPTIONS[0]);
      expect(component.treeSelection).toBeTruthy();
      expect(component.treeSelection.key).toBe('0');
    });

    it('should resolve multiple treeSelection when writeValue is called with an array', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      expect(Array.isArray(component.treeSelection)).toBe(true);
      expect(component.treeSelection).toHaveLength(2);
    });

    it('should not update treeSelection when writeValue is called with internal=true', () => {
      component.treeSelection = undefined;
      component.writeValue(OPTIONS[0], true);
      expect(component.treeSelection).toBeUndefined();
    });

    it('should not update treeSelection when writeValue is called with null', () => {
      component.treeSelection = undefined;
      component.writeValue(null);
      expect(component.treeSelection).toBeUndefined();
    });

    it('should return the original option via treeSelectionToValue (single)', () => {
      const result = component.treeSelectionToValue(component.innerOptions[0]);
      expect(result).toEqual(OPTIONS[0]);
    });

    it('should return array of original options via treeSelectionToValue (multiple)', () => {
      fixture.componentRef.setInput('multiple', true);
      const result = component.treeSelectionToValue([
        component.innerOptions[0],
        component.innerOptions[1]
      ]);
      expect(result).toEqual([OPTIONS[0], OPTIONS[1]]);
    });

    it('should return undefined from treeSelectionToValue for undefined input (single)', () => {
      expect(component.treeSelectionToValue(undefined)).toBeUndefined();
    });

    it('should return empty array from treeSelectionToValue for undefined input (multiple)', () => {
      fixture.componentRef.setInput('multiple', true);
      expect(component.treeSelectionToValue(undefined)).toEqual([]);
    });

    it('should emit valueChanged on updateValue', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.updateValue(OPTIONS[0]);
      expect(component.valueChanged.emit).toHaveBeenCalledWith(OPTIONS[0]);
    });

    it('should invoke onChange callback on updateValue', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);
      component.updateValue(OPTIONS[1]);
      expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    });
  });

  describe('ControlValueAccessor', () => {
    it('should register and invoke onChange callback', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.writeValue(OPTIONS[0]);
      expect(fn).toHaveBeenCalledWith(OPTIONS[0]);
    });

    it('should register onTouched callback', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });
  });

  describe('Clear & Remove', () => {
    it('should clear single value and emit undefined', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.writeValue(OPTIONS[0]);
      fixture.detectChanges();
      component.clear();
      expect(component.value).toBeUndefined();
      expect(component.treeSelection).toBeUndefined();
      expect(component.valueChanged.emit).toHaveBeenCalledWith(undefined);
    });

    it('should clear multiple value and emit empty array', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      jest.spyOn(component.valueChanged, 'emit');
      component.clear();
      expect(component.value).toEqual([]);
      expect(component.treeSelection).toEqual([]);
      expect(component.valueChanged.emit).toHaveBeenCalledWith([]);
    });

    it('should not emit when clear is called with no single value', () => {
      jest.spyOn(component.valueChanged, 'emit');
      component.writeValue(undefined);
      component.clear();
      expect(component.valueChanged.emit).not.toHaveBeenCalled();
    });

    it('should not emit when clear is called with empty multiple value', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([]);
      jest.spyOn(component.valueChanged, 'emit');
      component.clear();
      expect(component.valueChanged.emit).not.toHaveBeenCalled();
    });

    it('should open dropdown when openOnClear is true', () => {
      fixture.componentRef.setInput('openOnClear', true);
      component.writeValue(OPTIONS[0]);
      component.clear();
      expect(component.isOpened).toBe(true);
    });

    it('should not open dropdown when openOnClear is false', () => {
      fixture.componentRef.setInput('openOnClear', false);
      component.writeValue(OPTIONS[0]);
      component.clear();
      expect(component.isOpened).toBe(false);
    });

    it('should remove the given node from multiple treeSelection', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      const toRemove = component.treeSelection[0];
      component.remove(toRemove);
      expect(component.treeSelection).toHaveLength(1);
      expect(component.value).not.toContainEqual(OPTIONS[0]);
    });

    it('should be a no-op when remove is called in single mode', () => {
      component.writeValue(OPTIONS[0]);
      jest.spyOn(component.valueChanged, 'emit');
      component.remove(component.treeSelection);
      expect(component.valueChanged.emit).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown Open / Close', () => {
    it('should open dropdown via toggleOptions(true)', () => {
      component.toggleOptions(true);
      expect(component.isOpened).toBe(true);
    });

    it('should close dropdown via toggleOptions(false)', () => {
      component.toggleOptions(true);
      component.toggleOptions(false);
      expect(component.isOpened).toBe(false);
    });

    it('should toggle the dropdown when toggleOptions is called without argument', () => {
      expect(component.isOpened).toBe(false);
      component.toggleOptions();
      expect(component.isOpened).toBe(true);
      component.toggleOptions();
      expect(component.isOpened).toBe(false);
    });

    it('should not open dropdown when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.toggleOptions(true);
      expect(component.isOpened).toBe(false);
    });

    it('should be a no-op when toggleOptions is called with the current state', () => {
      expect(component.isOpened).toBe(false);
      component.toggleOptions(false);
      expect(component.isOpened).toBe(false);
    });

    it('should reset optionFocused and isArrowNavigating when opening', () => {
      component.optionFocused = true;
      component.isArrowNavigating = true;
      component.toggleOptions(true);
      expect(component.optionFocused).toBe(false);
      expect(component.isArrowNavigating).toBe(false);
    });
  });

  describe('Scroll to selection on open', () => {
    // must run after any fixture.detectChanges() call in a test, since that
    // re-resolves @ViewChild('treeList') and would overwrite this stub
    const stubTreeList = () => {
      (component as any).treeList = {
        cd: { markForCheck: jest.fn(), detectChanges: jest.fn() },
        updateSerializedValue: jest.fn(),
        serializedValue: [{ node: { key: '0' } }, { node: { key: '1' } }],
        scroller: {
          calculateOptions: jest.fn(),
          cd: { detectChanges: jest.fn() }
        },
        scrollToVirtualIndex: jest.fn()
      };
    };

    beforeEach(() => {
      component.writeValue(OPTIONS[0]);
      stubTreeList();
    });

    it('should scroll the selected node into view when its element is found by key', fakeAsync(() => {
      const scrollIntoView = jest.fn();
      const querySelector = jest.fn().mockReturnValue({ scrollIntoView });
      (component as any).treeContainerElement = {
        querySelector,
        removeEventListener: jest.fn()
      };

      component.toggleOptions(true);
      tick();

      expect(querySelector).toHaveBeenCalledWith('.key-0');
      expect(scrollIntoView).toHaveBeenCalled();
      expect(
        (component as any).treeList.scrollToVirtualIndex
      ).not.toHaveBeenCalled();
    }));

    it('should fall back to scrollToVirtualIndex when the node is not rendered and virtualScroll is on', fakeAsync(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      stubTreeList();
      const querySelector = jest.fn().mockReturnValue(null);
      (component as any).treeContainerElement = {
        querySelector,
        removeEventListener: jest.fn()
      };

      component.toggleOptions(true);
      tick();

      // OPTIONS[0] resolves to key '0', which is at index 0 in serializedValue -
      // this locks in the `??` fix (findIndex returning 0 must not be discarded as "not found")
      expect(
        (component as any).treeList.scrollToVirtualIndex
      ).toHaveBeenCalledWith(0);
    }));

    it('should not scroll when the node is not rendered and virtualScroll is off', fakeAsync(() => {
      const querySelector = jest.fn().mockReturnValue(null);
      (component as any).treeContainerElement = {
        querySelector,
        removeEventListener: jest.fn()
      };

      component.toggleOptions(true);
      tick();

      expect(
        (component as any).treeList.scrollToVirtualIndex
      ).not.toHaveBeenCalled();
    }));

    it('should use the first selected key for scrolling when multiple is enabled', fakeAsync(() => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      stubTreeList();
      const scrollIntoView = jest.fn();
      const querySelector = jest.fn().mockReturnValue({ scrollIntoView });
      (component as any).treeContainerElement = {
        querySelector,
        removeEventListener: jest.fn()
      };

      component.toggleOptions(true);
      tick();

      expect(querySelector).toHaveBeenCalledWith('.key-0');
      expect(scrollIntoView).toHaveBeenCalled();
    }));
  });

  describe('Virtual scroll list height', () => {
    it('should set the height on scroller.elementViewChild, not scroller.style', () => {
      const elementViewChild = {
        nativeElement: { style: {} as Record<string, string> }
      };
      const scrollerStyle = {} as Record<string, string>;
      (component as any).treeList = {
        scroller: { style: scrollerStyle, elementViewChild }
      };

      (component as any)._setTreeListHeight('7.5rem');

      expect(elementViewChild.nativeElement.style.height).toBe('7.5rem');
      expect(scrollerStyle.height).toBeUndefined();
    });

    it('recalcVirtualListHeight should apply the computed height to elementViewChild', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();

      const elementViewChild = {
        nativeElement: { style: {} as Record<string, string> }
      };
      (component as any).treeList = {
        serializedValue: [{}, {}, {}],
        scroller: {
          style: {},
          elementViewChild,
          calculateOptions: jest.fn(),
          cd: { detectChanges: jest.fn() }
        }
      };

      component.recalcVirtualListHeight();

      expect(elementViewChild.nativeElement.style.height).toBe(
        `${component.virtualListHeightRem}rem`
      );
    });

    it('updateOptions should refresh serializedValue and force treeList to re-check so the scroller sees fresh items', () => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();

      const updateSerializedValue = jest.fn();
      const detectChanges = jest.fn();
      (component as any).treeList = {
        updateSerializedValue,
        cd: { detectChanges }
      };

      component.updateOptions();

      expect(updateSerializedValue).toHaveBeenCalled();
      expect(detectChanges).toHaveBeenCalled();
    });

    it('updateOptions should be a no-op when virtualScroll is disabled', () => {
      const updateSerializedValue = jest.fn();
      const detectChanges = jest.fn();
      (component as any).treeList = {
        updateSerializedValue,
        cd: { detectChanges }
      };

      component.updateOptions();

      expect(updateSerializedValue).not.toHaveBeenCalled();
      expect(detectChanges).not.toHaveBeenCalled();
    });
  });

  describe('Focus / Blur', () => {
    it('should emit focused on onFocus', () => {
      jest.spyOn(component.focused, 'emit');
      component.onFocus();
      expect(component.focused.emit).toHaveBeenCalled();
    });

    it('should emit blurred on onBlur', () => {
      jest.spyOn(component.blurred, 'emit');
      component.onBlur();
      expect(component.blurred.emit).toHaveBeenCalled();
    });
  });

  describe('Expand / Collapse', () => {
    it('should expand all nodes that have children', () => {
      component.expandAll();
      component.optionsMap.forEach((node) => {
        if (node.children?.length) {
          expect(node.expanded).toBe(true);
        }
      });
    });

    it('should collapse all nodes that have children', () => {
      component.expandAll();
      component.collapseAll();
      component.optionsMap.forEach((node) => {
        if (node.children?.length) {
          expect(node.expanded).toBe(false);
        }
      });
    });
  });

  describe('describedBy and isRequired', () => {
    it('should return null when hideDetails is true', () => {
      fixture.componentRef.setInput('hideDetails', true);
      expect(component.describedBy).toBeNull();
    });

    it('should return errorId when error is set', () => {
      component.error = 'Required';
      expect(component.describedBy).toBe(component.errorId);
    });

    it('should return hintId when hint is set', () => {
      fixture.componentRef.setInput('hint', 'Hint text');
      expect(component.describedBy).toBe(component.hintId);
    });

    it('should return null when neither error nor hint is set', () => {
      component.error = '';
      fixture.componentRef.setInput('hint', '');
      expect(component.describedBy).toBeNull();
    });

    it('should return false for isRequired when no form control is bound', () => {
      expect(component.isRequired).toBe(false);
    });
  });

  describe('onSelectNode', () => {
    it('should close the dropdown and focus the container in single mode', () => {
      component.toggleOptions(true);
      const focusSpy = jest.spyOn(
        component.componentContainer.nativeElement,
        'focus'
      );
      component.onSelectNode();
      expect(component.isOpened).toBe(false);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should do nothing in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.toggleOptions(true);
      component.onSelectNode();
      expect(component.isOpened).toBe(true);
    });
  });

  describe('onClickFullyExpandable', () => {
    it('should do nothing when the element has no key class', () => {
      const parent = document.createElement('div');
      const elem = document.createElement('div');
      parent.appendChild(elem);
      const updateOptionsSpy = jest.spyOn(component, 'updateOptions');
      component.onClickFullyExpandable(elem);
      expect(updateOptionsSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when no matching tree node is found for the key', () => {
      const parent = document.createElement('div');
      parent.classList.add('key-nonexistent');
      const elem = document.createElement('div');
      parent.appendChild(elem);
      const updateOptionsSpy = jest.spyOn(component, 'updateOptions');
      component.onClickFullyExpandable(elem);
      expect(updateOptionsSpy).not.toHaveBeenCalled();
    });

    it('should toggle expanded state and schedule a node-toggled focus update', fakeAsync(() => {
      const key = component.innerOptions[2].key!;
      const parent = document.createElement('div');
      parent.classList.add('key-' + key);
      const elem = document.createElement('div');
      parent.appendChild(elem);
      (component as any).treeList = {
        cd: { markForCheck: jest.fn() }
      };
      const wasExpanded = component.innerOptions[2].expanded;

      component.onClickFullyExpandable(elem);
      tick();

      expect(component.innerOptions[2].expanded).toBe(!wasExpanded);
    }));
  });

  describe('initArrowsNavigaton', () => {
    it('should do nothing when the dropdown is closed', () => {
      component.initArrowsNavigaton();
      expect(component.optionFocused).toBe(false);
    });

    it('should do nothing when an option is already focused', () => {
      component.toggleOptions(true);
      component.optionFocused = true;
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.initArrowsNavigaton();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('should focus the aria-selected treeitem when found', () => {
      component.toggleOptions(true);
      const selected = document.createElement('div');
      const querySelector = jest.fn().mockReturnValue(selected);
      (component as any).treeContainerElement = {
        querySelector,
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      component.initArrowsNavigaton();
      expect(querySelector).toHaveBeenCalledWith(
        '[role="treeitem"][aria-selected="true"]'
      );
      expect(component.optionFocused).toBe(true);
      expect(component.isArrowNavigating).toBe(true);
    });

    it('should fall back to the last visible node when navigating up with no selection', () => {
      component.toggleOptions(true);
      const last = document.createElement('div');
      jest
        .spyOn(component as any, '_getLastVisibleTreeNodeLi')
        .mockReturnValue(last);
      (component as any).treeContainerElement = {
        querySelector: () => null,
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.initArrowsNavigaton(true);
      expect(focusSpy).toHaveBeenCalledWith(last);
    });

    it('should fall back to the first tree node when navigating down with no selection', () => {
      component.toggleOptions(true);
      const first = document.createElement('div');
      const querySelector = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(first);
      (component as any).treeContainerElement = {
        querySelector,
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.initArrowsNavigaton(false);
      expect(focusSpy).toHaveBeenCalledWith(first);
    });
  });

  describe('_focusTreeNode', () => {
    it('should do nothing when elem is null', () => {
      expect(() => (component as any)._focusTreeNode(null)).not.toThrow();
    });

    it('should reset tabIndex of other tree items and focus the given element', () => {
      const other = document.createElement('div');
      other.tabIndex = 0;
      (component as any).treeContainerElement = {
        querySelectorAll: () => [other],
        removeEventListener: jest.fn()
      };
      const elem = document.createElement('div');
      const focusSpy = jest.spyOn(elem, 'focus');

      (component as any)._focusTreeNode(elem);

      expect(other.tabIndex).toBe(-1);
      expect(elem.tabIndex).toBe(0);
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('navigateIntoOptions', () => {
    it('should do nothing when the dropdown is closed', () => {
      const initSpy = jest.spyOn(component, 'initArrowsNavigaton');
      component.navigateIntoOptions(false);
      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when an option is already focused', () => {
      component.toggleOptions(true);
      component.optionFocused = true;
      const initSpy = jest.spyOn(component, 'initArrowsNavigaton');
      component.navigateIntoOptions(false);
      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should stop after initArrowsNavigaton when there is no selected node', () => {
      component.toggleOptions(true);
      (component as any).treeContainerElement = {
        querySelector: () => null,
        querySelectorAll: () => [] as any,
        contains: () => false,
        removeEventListener: jest.fn()
      };
      const initSpy = jest.spyOn(component, 'initArrowsNavigaton');
      component.navigateIntoOptions(false);
      expect(initSpy).toHaveBeenCalledWith(false);
    });

    it('should stop when there is no active element inside the container', () => {
      component.toggleOptions(true);
      const selected = document.createElement('div');
      (component as any).treeContainerElement = {
        querySelector: () => selected,
        querySelectorAll: () => [] as any,
        contains: () => false,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.navigateIntoOptions(false);
      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it('should focus the next treeitem when navigating forward', () => {
      component.toggleOptions(true);
      const item1 = document.createElement('div');
      const item2 = document.createElement('div');
      document.body.appendChild(item1);
      document.body.appendChild(item2);
      item1.tabIndex = 0;
      item1.focus();

      (component as any).treeContainerElement = {
        querySelector: () => item1,
        querySelectorAll: () => [item1, item2],
        contains: (el: Node) => el === item1 || el === item2,
        removeEventListener: jest.fn()
      };

      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.navigateIntoOptions(false);
      expect(focusSpy).toHaveBeenCalledWith(item2);

      item1.remove();
      item2.remove();
    });

    it('should do nothing further when there is no next treeitem', () => {
      component.toggleOptions(true);
      const item1 = document.createElement('div');
      document.body.appendChild(item1);
      item1.tabIndex = 0;
      item1.focus();

      (component as any).treeContainerElement = {
        querySelector: () => item1,
        querySelectorAll: () => [item1],
        contains: (el: Node) => el === item1,
        removeEventListener: jest.fn()
      };

      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.navigateIntoOptions(true);
      expect(focusSpy).toHaveBeenCalledTimes(1);

      item1.remove();
    });
  });

  describe('onOptionsKeyDown', () => {
    it('should close the dropdown on Escape', () => {
      component.toggleOptions(true);
      const event = { code: 'Escape', preventDefault: jest.fn() } as any;
      component.onOptionsKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isOpened).toBe(false);
    });

    it('should close the dropdown on Tab', () => {
      component.toggleOptions(true);
      const event = { code: 'Tab', preventDefault: jest.fn() } as any;
      component.onOptionsKeyDown(event);
      expect(component.isOpened).toBe(false);
    });

    it('should focus the last visible node on ArrowUp when target is active', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);
      target.tabIndex = 0;
      target.focus();

      const last = document.createElement('div');
      jest
        .spyOn(component as any, '_getLastVisibleTreeNodeLi')
        .mockReturnValue(last);
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');

      const event = {
        code: 'ArrowUp',
        target,
        preventDefault: jest.fn()
      } as any;
      component.onOptionsKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith(last);
      expect(component.isArrowNavigating).toBe(true);

      target.remove();
    });

    it('should focus the first tree node on ArrowDown when target is active', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);
      target.tabIndex = 0;
      target.focus();

      const first = document.createElement('div');
      (component as any).treeContainerElement = {
        querySelector: () => first,
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');

      const event = {
        code: 'ArrowDown',
        target,
        preventDefault: jest.fn()
      } as any;
      component.onOptionsKeyDown(event);

      expect(focusSpy).toHaveBeenCalledWith(first);

      target.remove();
    });

    it('should not navigate on ArrowDown when target is not the active element', () => {
      const target = document.createElement('div');
      const event = {
        code: 'ArrowDown',
        target,
        preventDefault: jest.fn()
      } as any;
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      component.onOptionsKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('should break early on Enter when aria-expanded is not present', () => {
      const target = document.createElement('div');
      const event = {
        code: 'Enter',
        target,
        preventDefault: jest.fn()
      } as any;
      expect(() => component.onOptionsKeyDown(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should click the toggle button and focus the first child when collapsed', fakeAsync(() => {
      const target = document.createElement('div');
      target.setAttribute('aria-expanded', 'false');
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'p-tree-node-toggle-button';
      const toggleClickSpy = jest.spyOn(toggleBtn, 'click');
      target.appendChild(toggleBtn);
      const firstChild = document.createElement('div');
      firstChild.setAttribute('role', 'treeitem');
      target.appendChild(firstChild);

      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      const event = {
        code: 'Enter',
        target,
        preventDefault: jest.fn()
      } as any;
      component.onOptionsKeyDown(event);
      tick();

      expect(toggleClickSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith(firstChild);
    }));

    it('should click the toggle button without scheduling a focus update when fully expandable and already expanded', () => {
      const target = document.createElement('div');
      target.setAttribute('aria-expanded', 'true');
      target.classList.add('cps-tree-node-fully-expandable');
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'p-tree-node-toggle-button';
      const toggleClickSpy = jest.spyOn(toggleBtn, 'click');
      target.appendChild(toggleBtn);

      const event = {
        code: 'Space',
        target,
        preventDefault: jest.fn()
      } as any;
      component.onOptionsKeyDown(event);

      expect(toggleClickSpy).toHaveBeenCalled();
    });

    it('should do nothing on NumpadEnter when already expanded and not fully expandable', () => {
      const target = document.createElement('div');
      target.setAttribute('aria-expanded', 'true');
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'p-tree-node-toggle-button';
      const toggleClickSpy = jest.spyOn(toggleBtn, 'click');
      target.appendChild(toggleBtn);

      const event = {
        code: 'NumpadEnter',
        target,
        preventDefault: jest.fn()
      } as any;
      component.onOptionsKeyDown(event);

      expect(toggleClickSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when collapsed but there is no toggle button', () => {
      const target = document.createElement('div');
      target.setAttribute('aria-expanded', 'false');
      const event = {
        code: 'Enter',
        target,
        preventDefault: jest.fn()
      } as any;
      expect(() => component.onOptionsKeyDown(event)).not.toThrow();
    });
  });

  describe('_handleOnContainerClick', () => {
    it('should invoke onClickFullyExpandable when the clicked element is a fully-expandable node content', () => {
      const parent = document.createElement('div');
      parent.classList.add('cps-tree-node-fully-expandable');
      const content = document.createElement('div');
      content.classList.add('p-tree-node-content');
      parent.appendChild(content);

      const expandSpy = jest
        .spyOn(component, 'onClickFullyExpandable')
        .mockImplementation(() => {});
      (component as any)._handleOnContainerClick({ target: content });

      expect(expandSpy).toHaveBeenCalledWith(content);
      expect(component.optionFocused).toBe(true);
      expect(component.isArrowNavigating).toBe(false);
    });

    it('should climb up to find the node-content ancestor', () => {
      const parent = document.createElement('div');
      parent.classList.add('cps-tree-node-fully-expandable');
      const content = document.createElement('div');
      content.classList.add('p-tree-node-content');
      const inner = document.createElement('span');
      content.appendChild(inner);
      parent.appendChild(content);

      const expandSpy = jest
        .spyOn(component, 'onClickFullyExpandable')
        .mockImplementation(() => {});
      (component as any)._handleOnContainerClick({ target: inner });

      expect(expandSpy).toHaveBeenCalledWith(content);
    });

    it('should not invoke onClickFullyExpandable when no ancestor has node-content class', () => {
      const detached = document.createElement('span');
      const expandSpy = jest
        .spyOn(component, 'onClickFullyExpandable')
        .mockImplementation(() => {});
      (component as any)._handleOnContainerClick({ target: detached });
      expect(expandSpy).not.toHaveBeenCalled();
    });

    it('should not invoke onClickFullyExpandable when the parent is not fully-expandable', () => {
      const parent = document.createElement('div');
      const content = document.createElement('div');
      content.classList.add('p-tree-node-content');
      parent.appendChild(content);

      const expandSpy = jest
        .spyOn(component, 'onClickFullyExpandable')
        .mockImplementation(() => {});
      (component as any)._handleOnContainerClick({ target: content });
      expect(expandSpy).not.toHaveBeenCalled();
    });
  });

  describe('_getHTMLElementKey', () => {
    it('should return an empty string when the element has no classList', () => {
      expect((component as any)._getHTMLElementKey(null)).toBe('');
      expect((component as any)._getHTMLElementKey({})).toBe('');
    });

    it('should return an empty string when no class starts with key-', () => {
      const el = document.createElement('div');
      el.className = 'foo bar';
      expect((component as any)._getHTMLElementKey(el)).toBe('');
    });

    it('should extract the key from a key- prefixed class', () => {
      const el = document.createElement('div');
      el.className = 'foo key-abc bar';
      expect((component as any)._getHTMLElementKey(el)).toBe('abc');
    });
  });

  describe('_nodeToggled', () => {
    beforeEach(() => {
      (component as any).treeList = { cd: { markForCheck: jest.fn() } };
    });

    it('should focus the element found by key', fakeAsync(() => {
      const found = document.createElement('div');
      (component as any).treeContainerElement = {
        querySelector: jest.fn().mockReturnValue(found),
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      const alignSpy = jest
        .spyOn(component.optionsMenu, 'align')
        .mockImplementation(() => {});

      (component as any)._nodeToggled(document.createElement('div'), 'abc');
      tick();

      expect(focusSpy).toHaveBeenCalledWith(found);
      expect(alignSpy).toHaveBeenCalled();
    }));

    it('should focus the parent element when no key is provided', fakeAsync(() => {
      jest.spyOn(component.optionsMenu, 'align').mockImplementation(() => {});
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      const parent = document.createElement('div');
      const elem = document.createElement('div');
      parent.appendChild(elem);

      (component as any)._nodeToggled(elem);
      tick();

      expect(focusSpy).toHaveBeenCalledWith(parent);
    }));
  });

  describe('_refocusVirtualNode', () => {
    it('should do nothing when key is undefined', () => {
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');
      (component as any)._refocusVirtualNode(undefined);
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('should focus the element found by key', fakeAsync(() => {
      const found = document.createElement('div');
      (component as any).treeContainerElement = {
        querySelector: jest.fn().mockReturnValue(found),
        querySelectorAll: () => [] as any,
        removeEventListener: jest.fn()
      };
      const focusSpy = jest.spyOn(component as any, '_focusTreeNode');

      (component as any)._refocusVirtualNode('xyz');
      tick();

      expect(focusSpy).toHaveBeenCalledWith(found);
    }));
  });

  describe('onNodeExpand / onNodeCollapse', () => {
    it('should refocus the virtual node when virtualScroll is enabled (expand)', fakeAsync(() => {
      fixture.componentRef.setInput('virtualScroll', true);
      fixture.detectChanges();
      (component as any).treeList = { cd: { markForCheck: jest.fn() } };
      const refocusSpy = jest.spyOn(component as any, '_refocusVirtualNode');
      const parent = document.createElement('div');
      const currentTarget = document.createElement('div');
      parent.appendChild(currentTarget);

      component.onNodeExpand({
        originalEvent: { currentTarget },
        node: { key: 'k1' }
      });
      tick();

      expect(refocusSpy).toHaveBeenCalledWith('k1');
    }));

    it('should not refocus when virtualScroll is disabled (collapse)', () => {
      (component as any).treeList = { cd: { markForCheck: jest.fn() } };
      const refocusSpy = jest.spyOn(component as any, '_refocusVirtualNode');
      const parent = document.createElement('div');
      const currentTarget = document.createElement('div');
      parent.appendChild(currentTarget);

      component.onNodeCollapse({
        originalEvent: { currentTarget },
        node: { key: 'k1' }
      });

      expect(refocusSpy).not.toHaveBeenCalled();
    });
  });

  describe('_checkErrors', () => {
    it('should clear error when the control is not touched', () => {
      (component as any).control = { control: { touched: false }, errors: {} };
      component.error = 'stale';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should clear error when there are no errors', () => {
      (component as any).control = {
        control: { touched: true },
        errors: null
      };
      component.error = 'stale';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should set a required message when errors include required', () => {
      (component as any).control = {
        control: { touched: true },
        errors: { required: true }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Field is required');
    });

    it('should clear error when errors is an empty object', () => {
      (component as any).control = {
        control: { touched: true },
        errors: {}
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should use a string error message when present', () => {
      (component as any).control = {
        control: { touched: true },
        errors: { custom: 'Custom error message' }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Custom error message');
    });

    it('should fall back to Unknown error when no string message is found', () => {
      (component as any).control = {
        control: { touched: true },
        errors: { custom: 42 }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Unknown error');
    });
  });

  describe('_expandToNodes', () => {
    it('should expand the parent node and recurse when found', () => {
      const child = { key: '0-0' };
      const parentNode = { key: '0', expanded: false };
      component.optionsMap.set('0', parentNode as any);
      (component as any)._expandToNodes([child]);
      expect(parentNode.expanded).toBe(true);
    });

    it('should do nothing when the parent node is not found', () => {
      expect(() =>
        (component as any)._expandToNodes([{ key: 'unknown' }])
      ).not.toThrow();
    });

    it('should do nothing for a top-level key with no separator', () => {
      expect(() =>
        (component as any)._expandToNodes([{ key: '5' }])
      ).not.toThrow();
    });
  });

  describe('_valueToTreeSelection via writeValue', () => {
    it('should skip unmatched values in multiple mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.writeValue([OPTIONS[0], { label: 'Unknown', value: 'zzz' }]);
      expect(component.treeSelection).toHaveLength(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove the container click listener and disconnect the resize observer', () => {
      const removeEventListener = jest.fn();
      (component as any).treeContainerElement = { removeEventListener };
      const disconnectSpy = jest.spyOn(component.resizeObserver, 'disconnect');

      component.ngOnDestroy();

      expect(removeEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should not throw when there is no treeContainerElement', () => {
      (component as any).treeContainerElement = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('resizeObserver callback', () => {
    let capturedCallback: any;
    let localFixture: ComponentFixture<CpsTreeSelectComponent>;
    let localComponent: CpsTreeSelectComponent;
    let OriginalResizeObserver: typeof ResizeObserver;

    beforeEach(() => {
      OriginalResizeObserver = window.ResizeObserver;
      capturedCallback = undefined;
      (window as any).ResizeObserver = class {
        constructor(cb: any) {
          if (!capturedCallback) capturedCallback = cb;
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      };

      localFixture = TestBed.createComponent(CpsTreeSelectComponent);
      localComponent = localFixture.componentInstance;
      localFixture.componentRef.setInput('ariaLabel', 'Test tree select 2');
      localFixture.componentRef.setInput('options', OPTIONS);
      localFixture.detectChanges();
    });

    afterEach(() => {
      window.ResizeObserver = OriginalResizeObserver;
    });

    it('should update boxWidthPx when a resize entry has a target', () => {
      capturedCallback?.(
        [{ target: { offsetWidth: 123 } } as any],
        {} as ResizeObserver
      );
      expect(localComponent.boxWidthPx).toBe(123);
    });

    it('should skip entries without a target', () => {
      const before = localComponent.boxWidthPx;
      capturedCallback?.([{ target: undefined } as any], {} as ResizeObserver);
      expect(localComponent.boxWidthPx).toBe(before);
    });
  });

  describe('treeSelectionChanged', () => {
    it('should update the value from the tree selection', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);
      component.treeSelectionChanged(component.innerOptions[0]);
      expect(onChange).toHaveBeenCalledWith(OPTIONS[0]);
    });
  });

  describe('_findLastVisibleDescendantLi', () => {
    it('should return the node li when it has no nested children', () => {
      const pTreeNode = document.createElement('div');
      const li = document.createElement('li');
      li.setAttribute('data-pc-section', 'node');
      const placeholder = document.createElement('div');
      const childrenUl = document.createElement('ul');
      li.appendChild(placeholder);
      li.appendChild(childrenUl);
      pTreeNode.appendChild(li);

      const result = (component as any)._findLastVisibleDescendantLi(pTreeNode);
      expect(result).toBe(li);
    });

    it('should recurse into the last nested child when present', () => {
      const outerNode = document.createElement('div');
      const outerLi = document.createElement('li');
      outerLi.setAttribute('data-pc-section', 'node');
      const outerPlaceholder = document.createElement('div');
      const outerChildrenUl = document.createElement('ul');
      outerLi.appendChild(outerPlaceholder);
      outerLi.appendChild(outerChildrenUl);
      outerNode.appendChild(outerLi);

      const innerNode = document.createElement('div');
      const innerLi = document.createElement('li');
      innerLi.setAttribute('data-pc-section', 'node');
      const innerPlaceholder = document.createElement('div');
      const innerChildrenUl = document.createElement('ul');
      innerLi.appendChild(innerPlaceholder);
      innerLi.appendChild(innerChildrenUl);
      innerNode.appendChild(innerLi);
      outerChildrenUl.appendChild(innerNode);

      const result = (component as any)._findLastVisibleDescendantLi(outerNode);
      expect(result).toBe(innerLi);
    });

    it('should return null when no node li is found', () => {
      const pTreeNode = document.createElement('div');
      const result = (component as any)._findLastVisibleDescendantLi(pTreeNode);
      expect(result).toBeNull();
    });
  });

  describe('directory options', () => {
    it('should mark directory options as fully-expandable and non-selectable', () => {
      fixture.componentRef.setInput('options', [
        {
          label: 'Folder',
          value: 'folder',
          isDirectory: true,
          children: [{ label: 'Child', value: 'child' }]
        }
      ]);
      fixture.detectChanges();

      const folderOption = component.innerOptions[0];
      expect(folderOption.type).toBe('directory');
      expect(folderOption.selectable).toBe(false);
      expect(folderOption.styleClass).toContain(
        'cps-tree-node-fully-expandable'
      );
    });

    it('should expand directory options initially when initialExpandDirectories is true', () => {
      fixture.componentRef.setInput('initialExpandDirectories', true);
      fixture.componentRef.setInput('options', [
        { label: 'Folder', value: 'folder', isDirectory: true }
      ]);
      fixture.detectChanges();

      expect(component.innerOptions[0].expanded).toBe(true);
    });
  });

  describe('ngOnInit with a pre-existing value', () => {
    it('should resolve treeSelection from the initial value before the first change detection', () => {
      const freshFixture = TestBed.createComponent(CpsTreeSelectComponent);
      const freshComponent = freshFixture.componentInstance;
      freshFixture.componentRef.setInput('ariaLabel', 'Fresh tree select');
      freshFixture.componentRef.setInput('options', OPTIONS);
      freshComponent.writeValue(OPTIONS[0], true);

      freshFixture.detectChanges();

      expect(freshComponent.treeSelection).toBeTruthy();
      expect(freshComponent.treeSelection.key).toBe('0');
    });
  });

  describe('with NgControl (reactive forms)', () => {
    @Component({
      changeDetection: ChangeDetectionStrategy.Eager,
      imports: [CpsTreeSelectComponent, ReactiveFormsModule],
      template: `<cps-tree-select
        [formControl]="control"
        [options]="options"
        ariaLabel="Tree select"></cps-tree-select>`
    })
    class HostComponent {
      control = new FormControl(undefined, Validators.required);
      options = OPTIONS;
    }

    let hostFixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let treeSelect: CpsTreeSelectComponent;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [
          CombineLabelsPipe,
          {
            provide: CPS_ROOT_FONT_SIZE_SERVICE,
            useValue: mockRootFontSizeService
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      hostFixture = TestBed.createComponent(HostComponent);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
      treeSelect = hostFixture.debugElement.children[0].componentInstance;
    });

    it('should register itself as the valueAccessor on the NgControl', () => {
      treeSelect.writeValue(treeSelect.options[0]);
      treeSelect.value = treeSelect.options[0];
      hostFixture.detectChanges();
      expect(host.control.value).toEqual(treeSelect.options[0]);
    });

    it('should run _checkErrors when the control status changes', () => {
      host.control.markAsTouched();
      host.control.updateValueAndValidity();
      expect(treeSelect.error).toBe('Field is required');
    });
  });
});
