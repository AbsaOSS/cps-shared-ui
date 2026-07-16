import {
  Component,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
  inject
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TTCheckbox } from '../../../../primeng-temp/treetable/public_api';
import { CpsTreeTableRowSelectableDirective } from './cps-tree-table-row-selectable.directive';

@Component({
  template: `<td [cpsTTRowSelectable]="value"></td>`,
  imports: [CpsTreeTableRowSelectableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTreeTableRowSelectableDirective)
  directive!: CpsTreeTableRowSelectableDirective;

  value: unknown = 'row-1';
}

@Component({ template: '' })
class VcrProbeComponent {
  readonly vcr = inject(ViewContainerRef);
}

describe('CpsTreeTableRowSelectableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTreeTableRowSelectableDirective;
  let mockCheckboxRef: {
    setInput: jest.Mock;
    destroy: jest.Mock;
    location: { nativeElement: HTMLElement };
  };
  let createComponentSpy: jest.SpyInstance;

  beforeEach(async () => {
    const checkboxEl = document.createElement('div');
    checkboxEl.className = 'p-treetablecheckbox';

    mockCheckboxRef = {
      setInput: jest.fn(),
      destroy: jest.fn(),
      location: { nativeElement: checkboxEl }
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, VcrProbeComponent, NoopAnimationsModule]
    }).compileComponents();

    const probeFixture = TestBed.createComponent(VcrProbeComponent);
    const vcrProto = Object.getPrototypeOf(probeFixture.componentInstance.vcr);
    createComponentSpy = jest
      .spyOn(vcrProto, 'createComponent')
      .mockReturnValue(mockCheckboxRef as unknown as ComponentRef<TTCheckbox>);

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = host.directive;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('constructor', () => {
    it('should call createComponent with TTCheckbox', () => {
      expect(createComponentSpy).toHaveBeenCalledWith(TTCheckbox);
    });

    it('should store the ComponentRef in checkboxCompRef', () => {
      expect(directive.checkboxCompRef).toBe(mockCheckboxRef);
    });
  });

  describe('value input', () => {
    it('should accept value via cpsTTRowSelectable alias', () => {
      expect(directive.value).toBe('row-1');
    });

    it('should update value when the input changes', () => {
      host.value = { id: 42 };
      fixture.detectChanges();
      expect(directive.value).toEqual({ id: 42 });
    });
  });

  describe('ngOnInit', () => {
    it('should add cps-treetable-selectable-cell class to the host element', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      expect(td.classList.contains('cps-treetable-selectable-cell')).toBe(true);
    });

    it('should set value input on the checkbox component', () => {
      expect(mockCheckboxRef.setInput).toHaveBeenCalledWith('value', 'row-1');
    });

    it('should set pt input with aria-label and tabindex on the checkbox component', () => {
      expect(mockCheckboxRef.setInput).toHaveBeenCalledWith('pt', {
        pcRowCheckbox: { input: { 'aria-label': 'Select row', tabindex: '0' } }
      });
    });

    it('should append the checkbox element inside the host td', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      expect(td.contains(mockCheckboxRef.location.nativeElement)).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call checkboxCompRef.destroy', () => {
      directive.ngOnDestroy();
      expect(mockCheckboxRef.destroy).toHaveBeenCalled();
    });

    it('should call viewContainerRef.clear', () => {
      const vcr = (
        directive as unknown as { viewContainerRef: ViewContainerRef }
      ).viewContainerRef;
      const clearSpy = jest.spyOn(vcr, 'clear');
      directive.ngOnDestroy();
      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
