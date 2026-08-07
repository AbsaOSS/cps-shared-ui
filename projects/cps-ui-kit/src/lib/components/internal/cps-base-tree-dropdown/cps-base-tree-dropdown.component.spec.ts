import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
});
