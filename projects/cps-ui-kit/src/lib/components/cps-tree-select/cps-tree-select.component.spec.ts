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

    it('should do nothing on Tab when already closed', () => {
      jest.spyOn(component, 'toggleOptions');
      component.onKeyDown(keyEvent('Tab'));
      expect(component.toggleOptions).not.toHaveBeenCalled();
    });

    it('should do nothing for an unrelated key', () => {
      const event = keyEvent('KeyA');
      jest.spyOn(event, 'preventDefault');
      expect(() => component.onKeyDown(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should navigate into options on ArrowDown when already open', () => {
      component.toggleOptions(true);
      jest.spyOn(component, 'navigateIntoOptions').mockImplementation(() => {});
      component.onKeyDown(keyEvent('ArrowDown'));
      expect(component.navigateIntoOptions).toHaveBeenCalledWith(false);
    });

    it('should schedule initial arrow navigation after opening', fakeAsync(() => {
      jest.spyOn(component, 'initArrowsNavigaton').mockImplementation(() => {});
      component.onKeyDown(keyEvent('ArrowDown'));
      tick();
      expect(component.initArrowsNavigaton).toHaveBeenCalledWith(false);
      discardPeriodicTasks();
    }));
  });

  describe('multi-select chips (track expression / NG0956 regression)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('chips', true);
    });

    it('should render chips with correct labels for real tree selections', () => {
      component.writeValue([OPTIONS[0], OPTIONS[1]]);
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const chipLabels = fixture.debugElement
        .queryAll(By.css('cps-chip'))
        .map((el) => el.componentInstance.label);
      expect(chipLabels).toEqual(['Option 1', 'Option 2']);
    });

    it('should not warn when re-selecting a different but overlapping set of nodes', () => {
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
      const NESTED_OPTIONS = [
        {
          label: 'Parent A',
          value: 'a',
          children: [
            { label: 'Child A1', value: 'a1' },
            { label: 'Child A2', value: 'a2' }
          ]
        },
        {
          label: 'Parent B',
          value: 'b',
          children: [{ label: 'Child B1', value: 'b1' }]
        }
      ];
      fixture.componentRef.setInput('options', NESTED_OPTIONS);
      fixture.detectChanges();

      component.writeValue([
        NESTED_OPTIONS[0].children[1],
        NESTED_OPTIONS[1].children[0]
      ]);
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
      expect(chipLabels).toEqual(['Child A2', 'Child B1']);
    });
  });
});
