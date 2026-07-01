import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { DomHandler } from 'primeng/dom';
import { TreeTable } from 'primeng/treetable';
import { CpsTreeTableColumnSortableDirective } from './cps-tree-table-column-sortable.directive';

@Component({
  template: `<th [cpsTTColSortable]="field"><span>Name</span></th>`,
  imports: [CpsTreeTableColumnSortableDirective]
})
class TestHostComponent {
  @ViewChild(CpsTreeTableColumnSortableDirective)
  directive!: CpsTreeTableColumnSortableDirective;

  field = 'name';
}

describe('CpsTreeTableColumnSortableDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let directive: CpsTreeTableColumnSortableDirective;
  let mockTreeTable: ReturnType<typeof buildMockTreeTable>;
  let sortSourceSubject: Subject<unknown>;

  function buildMockTreeTable() {
    sortSourceSubject = new Subject();
    return {
      ngOnDestroy: jest.fn(),
      sortMode: 'single',
      sortOrder: 1 as number,
      isSorted: jest
        .fn<boolean | null | undefined, [string]>()
        .mockReturnValue(true),
      getSortMeta: jest
        .fn<{ field: string; order: number } | null, [string]>()
        .mockReturnValue(null),
      sort: jest.fn(),
      tableService: { sortSource$: sortSourceSubject.asObservable() }
    };
  }

  beforeEach(async () => {
    mockTreeTable = buildMockTreeTable();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [{ provide: TreeTable, useValue: mockTreeTable }]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = host.directive;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body
      .querySelectorAll('cps-sort-icon')
      .forEach((el) => el.remove());
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should create a CpsSortIconComponent in sortIconRef', () => {
    expect(directive.sortIconRef).toBeTruthy();
    expect(directive.sortIconRef.instance).toBeTruthy();
  });

  describe('field input', () => {
    it('should set field via cpsTTColSortable alias', () => {
      expect(directive.field).toBe('name');
    });

    it('should update field when input changes', () => {
      host.field = 'age';
      fixture.detectChanges();
      expect(directive.field).toBe('age');
    });
  });

  describe('ngOnInit', () => {
    it('should append the sort icon element inside the host th', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      expect(th.contains(directive.sortIconRef.location.nativeElement)).toBe(
        true
      );
    });

    it('should set the field on the sort icon component', () => {
      expect(directive.sortIconRef.instance.field).toBe('name');
    });

    it('should set aria-sort on the host element after init', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      expect(th.getAttribute('aria-sort')).not.toBeNull();
    });

    it('should subscribe to sortSource$', () => {
      expect(
        (directive as unknown as { _sortSub: unknown })._sortSub
      ).toBeTruthy();
    });
  });

  describe('host class', () => {
    it('should add p-sortable-column class to the host element', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      expect(th.classList.contains('p-sortable-column')).toBe(true);
    });
  });

  describe('_updateAriaSort (via sortSource$ or init)', () => {
    let th: HTMLElement;

    beforeEach(() => {
      th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
    });

    it('should set aria-sort to "ascending" in single mode when sortOrder is 1', () => {
      mockTreeTable.sortMode = 'single';
      mockTreeTable.sortOrder = 1;
      mockTreeTable.isSorted.mockReturnValue(true);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('ascending');
    });

    it('should set aria-sort to "descending" in single mode when sortOrder is -1', () => {
      mockTreeTable.sortMode = 'single';
      mockTreeTable.sortOrder = -1;
      mockTreeTable.isSorted.mockReturnValue(true);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('descending');
    });

    it('should set aria-sort to "none" in single mode when field is not sorted', () => {
      mockTreeTable.sortMode = 'single';
      mockTreeTable.isSorted.mockReturnValue(false);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('none');
    });

    it('should set aria-sort to "ascending" in multiple mode when meta order is 1', () => {
      mockTreeTable.sortMode = 'multiple';
      mockTreeTable.getSortMeta.mockReturnValue({ field: 'name', order: 1 });
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('ascending');
    });

    it('should set aria-sort to "descending" in multiple mode when meta order is -1', () => {
      mockTreeTable.sortMode = 'multiple';
      mockTreeTable.getSortMeta.mockReturnValue({ field: 'name', order: -1 });
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('descending');
    });

    it('should set aria-sort to "none" in multiple mode when getSortMeta returns null', () => {
      mockTreeTable.sortMode = 'multiple';
      mockTreeTable.getSortMeta.mockReturnValue(null);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('none');
    });

    it('should re-evaluate aria-sort each time sortSource$ emits', () => {
      mockTreeTable.sortMode = 'single';
      mockTreeTable.sortOrder = 1;
      mockTreeTable.isSorted.mockReturnValue(true);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('ascending');

      mockTreeTable.isSorted.mockReturnValue(false);
      sortSourceSubject.next(null);
      expect(th.getAttribute('aria-sort')).toBe('none');
    });
  });

  describe('onClick', () => {
    beforeEach(() => {
      jest.spyOn(DomHandler, 'clearSelection').mockImplementation(() => {});
    });

    it('should call tt.sort with the current field', () => {
      directive.onClick(new MouseEvent('click'));
      expect(mockTreeTable.sort).toHaveBeenCalledWith({ field: 'name' });
    });

    it('should call DomHandler.clearSelection', () => {
      directive.onClick(new MouseEvent('click'));
      expect(DomHandler.clearSelection).toHaveBeenCalled();
    });

    it('should not sort when event target is inside .cps-table-col-filter', () => {
      const filter = document.createElement('div');
      filter.className = 'cps-table-col-filter';
      const inner = document.createElement('button');
      filter.appendChild(inner);
      document.body.appendChild(filter);

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: inner });

      directive.onClick(event);

      expect(mockTreeTable.sort).not.toHaveBeenCalled();
      expect(DomHandler.clearSelection).not.toHaveBeenCalled();

      filter.remove();
    });

    it('should sort when event target is not inside .cps-table-col-filter', () => {
      const outside = document.createElement('span');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outside });

      directive.onClick(event);

      expect(mockTreeTable.sort).toHaveBeenCalledWith({ field: 'name' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from sortSource$', () => {
      const sub = (
        directive as unknown as { _sortSub: { unsubscribe: () => void } }
      )._sortSub;
      jest.spyOn(sub, 'unsubscribe');
      directive.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });

    it('should call sortIconRef.destroy', () => {
      jest.spyOn(directive.sortIconRef, 'destroy');
      directive.ngOnDestroy();
      expect(directive.sortIconRef.destroy).toHaveBeenCalled();
    });

    it('should stop reacting to sortSource$ after destroy', () => {
      const th = fixture.debugElement.query(By.css('th'))
        .nativeElement as HTMLElement;
      directive.ngOnDestroy();
      const valueBefore = th.getAttribute('aria-sort');

      mockTreeTable.isSorted.mockReturnValue(false);
      sortSourceSubject.next(null);

      expect(th.getAttribute('aria-sort')).toBe(valueBefore);
    });
  });
});
