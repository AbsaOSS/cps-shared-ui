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
import { TreeTableToggler } from '../../../../primeng-temp/treetable/public_api';
import { CpsTreetableRowTogglerDirective } from './cps-tree-table-row-toggler.directive';

@Component({
  template: `<td [cpsTTRowToggler]="rowNode">
    <span class="cell-content">Content</span>
  </td>`,
  imports: [CpsTreetableRowTogglerDirective]
})
class TestHostComponent {
  @ViewChild(CpsTreetableRowTogglerDirective)
  directive!: CpsTreetableRowTogglerDirective;

  rowNode: unknown = { node: { data: 'row-1' } };
}

@Component({ template: '' })
class VcrProbeComponent {
  readonly vcr = inject(ViewContainerRef);
}

describe('CpsTreetableRowTogglerDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTreetableRowTogglerDirective;
  let mockTogglerRef: {
    setInput: jest.Mock;
    destroy: jest.Mock;
    location: { nativeElement: HTMLElement };
  };
  let createComponentSpy: jest.SpyInstance;

  beforeEach(async () => {
    const togglerEl = document.createElement('button');
    togglerEl.className = 'p-treetable-toggler';

    mockTogglerRef = {
      setInput: jest.fn(),
      destroy: jest.fn(),
      location: { nativeElement: togglerEl }
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, VcrProbeComponent, NoopAnimationsModule]
    }).compileComponents();

    const probeFixture = TestBed.createComponent(VcrProbeComponent);
    const vcrProto = Object.getPrototypeOf(probeFixture.componentInstance.vcr);
    createComponentSpy = jest
      .spyOn(vcrProto, 'createComponent')
      .mockReturnValue(
        mockTogglerRef as unknown as ComponentRef<TreeTableToggler>
      );

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
    it('should call createComponent with TreeTableToggler', () => {
      expect(createComponentSpy).toHaveBeenCalledWith(TreeTableToggler);
    });

    it('should store the ComponentRef in togglerCompRef', () => {
      expect(directive.togglerCompRef).toBe(mockTogglerRef);
    });
  });

  describe('rowNode input', () => {
    it('should accept rowNode via cpsTTRowToggler alias', () => {
      expect(directive.rowNode).toEqual({ node: { data: 'row-1' } });
    });

    it('should update rowNode when the input changes', () => {
      host.rowNode = { node: { data: 'row-2' } };
      fixture.detectChanges();
      expect(directive.rowNode).toEqual({ node: { data: 'row-2' } });
    });
  });

  describe('ngOnInit', () => {
    it('should add cps-treetable-row-toggler-cell class to the host element', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      expect(td.classList.contains('cps-treetable-row-toggler-cell')).toBe(
        true
      );
    });

    it('should set rowNode input on the toggler component', () => {
      expect(mockTogglerRef.setInput).toHaveBeenCalledWith(
        'rowNode',
        expect.objectContaining({ node: { data: 'row-1' } })
      );
    });

    it('should create a wrapper span with display flex inside the host td', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      const spans = Array.from(td.children).filter(
        (el) =>
          el.tagName === 'SPAN' && (el as HTMLElement).style.display === 'flex'
      ) as HTMLElement[];
      expect(spans.length).toBeGreaterThan(0);
    });

    it('should move existing cell content into the wrapper span', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      const wrapperSpan = Array.from(td.children).find(
        (el) =>
          el.tagName === 'SPAN' && (el as HTMLElement).style.display === 'flex'
      ) as HTMLElement;
      const cellContent = wrapperSpan.querySelector('.cell-content');
      expect(cellContent).not.toBeNull();
    });

    it('should prepend the toggler element as the first child of the wrapper span', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      const wrapperSpan = Array.from(td.children).find(
        (el) =>
          el.tagName === 'SPAN' && (el as HTMLElement).style.display === 'flex'
      ) as HTMLElement;
      expect(wrapperSpan.firstChild).toBe(
        mockTogglerRef.location.nativeElement
      );
    });

    it('should append the wrapper span as a child of the host td', () => {
      const td = fixture.debugElement.query(By.css('td'))
        .nativeElement as HTMLElement;
      const wrapperSpan = Array.from(td.children).find(
        (el) =>
          el.tagName === 'SPAN' && (el as HTMLElement).style.display === 'flex'
      );
      expect(wrapperSpan).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    it('should call setInput again when rowNode changes', () => {
      mockTogglerRef.setInput.mockClear();
      host.rowNode = { node: { data: 'updated' } };
      fixture.detectChanges();
      expect(mockTogglerRef.setInput).toHaveBeenCalledWith(
        'rowNode',
        expect.objectContaining({ node: { data: 'updated' } })
      );
    });

    it('should reflect the new node expanded state after change', () => {
      host.rowNode = { node: { data: 'updated', expanded: true } };
      fixture.detectChanges();
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.expanded).toBe(false);
    });
  });

  describe('_rowNodeWithExpanded', () => {
    it('should return false for expanded when node.expanded is true', () => {
      host.rowNode = { node: { data: 'row-1', expanded: true } };
      fixture.detectChanges();
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.expanded).toBe(false);
    });

    it('should return true for expanded when node.expanded is false', () => {
      host.rowNode = { node: { data: 'row-1', expanded: false } };
      fixture.detectChanges();
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.expanded).toBe(true);
    });

    it('should return true for expanded when node has no expanded property', () => {
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.expanded).toBe(true);
    });

    it('expanded getter should reflect live mutations to node.expanded', () => {
      const node = { data: 'row-1', expanded: false };
      host.rowNode = { node };
      fixture.detectChanges();
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.expanded).toBe(true);
      node.expanded = true;
      expect(passedNode.expanded).toBe(false);
    });

    it('should preserve all other rowNode properties', () => {
      host.rowNode = {
        node: { data: 'row-1' },
        level: 2,
        parent: null,
        visible: true
      };
      fixture.detectChanges();
      const passedNode = mockTogglerRef.setInput.mock.calls.at(-1)![1];
      expect(passedNode.level).toBe(2);
      expect(passedNode.parent).toBeNull();
      expect(passedNode.visible).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call togglerCompRef.destroy', () => {
      directive.ngOnDestroy();
      expect(mockTogglerRef.destroy).toHaveBeenCalled();
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
