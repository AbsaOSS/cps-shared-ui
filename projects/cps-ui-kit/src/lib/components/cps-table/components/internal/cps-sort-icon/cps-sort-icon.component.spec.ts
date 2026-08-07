import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { Table } from 'primeng/table';
import { CpsSortIconComponent } from './cps-sort-icon.component';

describe('CpsSortIconComponent', () => {
  let component: CpsSortIconComponent;
  let fixture: ComponentFixture<CpsSortIconComponent>;
  let mockTable: Table;
  let sortSourceSubject: Subject<unknown>;

  beforeEach(async () => {
    sortSourceSubject = new Subject();
    mockTable = Object.create(Table.prototype) as Table;
    (mockTable as { ngOnDestroy: () => void }).ngOnDestroy = jest.fn();
    (mockTable as { tableService: unknown }).tableService = {
      sortSource$: sortSourceSubject.asObservable()
    };
    (mockTable as { sortMode: string }).sortMode = 'single';
    (mockTable as { sortOrder: number }).sortOrder = 1;
    (mockTable as { _multiSortMeta: unknown })._multiSortMeta = undefined;
    (mockTable as { showInitialSortBadge: boolean }).showInitialSortBadge =
      false;
    (mockTable as { groupRowsBy: unknown }).groupRowsBy = undefined;
    jest.spyOn(mockTable, 'isSorted').mockReturnValue(true);
    jest.spyOn(mockTable, 'getSortMeta').mockReturnValue(null);
    jest.spyOn(mockTable, 'sort').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [CpsSortIconComponent, NoopAnimationsModule],
      providers: [{ provide: Table, useValue: mockTable }]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsSortIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('defaults', () => {
    it('should default field to empty string', () => {
      expect(component.field).toBe('');
    });

    it('should expose the injected Table as dt', () => {
      expect(component.dt).toBe(mockTable);
    });
  });

  describe('host bindings', () => {
    it('should have tabindex 0', () => {
      expect(fixture.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('should have role button', () => {
      expect(fixture.nativeElement.getAttribute('role')).toBe('button');
    });

    it('should reflect sortAriaLabel in aria-label', () => {
      expect(fixture.nativeElement.getAttribute('aria-label')).toBe(
        component.sortAriaLabel
      );
    });
  });

  describe('sortAriaLabel', () => {
    it('should return "Sort descending" when sortOrder is 1', () => {
      component.sortOrder = 1;
      expect(component.sortAriaLabel).toBe('Sort descending');
    });

    it('should return "Remove sort" when sortOrder is -1', () => {
      component.sortOrder = -1;
      expect(component.sortAriaLabel).toBe('Remove sort');
    });

    it('should return "Sort ascending" when sortOrder is 0', () => {
      component.sortOrder = 0;
      expect(component.sortAriaLabel).toBe('Sort ascending');
    });
  });

  describe('updateSortState', () => {
    it('should set sortOrder from table.sortOrder in single mode when isSorted is true', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      (mockTable as { sortOrder: number }).sortOrder = -1;
      jest.mocked(mockTable.isSorted).mockReturnValue(true);
      component.updateSortState();
      expect(component.sortOrder).toBe(-1);
    });

    it('should set sortOrder to 0 in single mode when isSorted is false', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      jest.mocked(mockTable.isSorted).mockReturnValue(false);
      component.updateSortState();
      expect(component.sortOrder).toBe(0);
    });

    it('should set sortOrder from sortMeta.order in multiple mode', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      jest.mocked(mockTable.getSortMeta).mockReturnValue({
        field: 'name',
        order: -1
      });
      component.updateSortState();
      expect(component.sortOrder).toBe(-1);
    });

    it('should set sortOrder to 0 in multiple mode when getSortMeta returns null', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      jest.mocked(mockTable.getSortMeta).mockReturnValue(null);
      component.updateSortState();
      expect(component.sortOrder).toBe(0);
    });

    it('should call cd.markForCheck', () => {
      jest.spyOn(component.cd, 'markForCheck');
      component.updateSortState();
      expect(component.cd.markForCheck).toHaveBeenCalled();
    });
  });

  describe('sortSource$ subscription', () => {
    it('should call updateSortState when sortSource$ emits', () => {
      jest.spyOn(component, 'updateSortState');
      sortSourceSubject.next(null);
      expect(component.updateSortState).toHaveBeenCalled();
    });
  });

  describe('getMultiSortMetaIndex', () => {
    it('should return -1 when _multiSortMeta is undefined', () => {
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = undefined;
      expect(component.getMultiSortMetaIndex()).toBe(-1);
    });

    it('should return -1 when sortMode is not multiple', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 }
      ];
      expect(component.getMultiSortMetaIndex()).toBe(-1);
    });

    it('should return -1 when multiSortMeta has one entry and showInitialSortBadge is false', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { showInitialSortBadge: boolean }).showInitialSortBadge =
        false;
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 }
      ];
      component.field = 'name';
      expect(component.getMultiSortMetaIndex()).toBe(-1);
    });

    it('should return index when showInitialSortBadge is true with single entry', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { showInitialSortBadge: boolean }).showInitialSortBadge =
        true;
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 }
      ];
      component.field = 'name';
      expect(component.getMultiSortMetaIndex()).toBe(0);
    });

    it('should return correct index when multiSortMeta has multiple entries', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'age';
      expect(component.getMultiSortMetaIndex()).toBe(1);
    });

    it('should return -1 when field is not in multiSortMeta', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'email';
      expect(component.getMultiSortMetaIndex()).toBe(-1);
    });
  });

  describe('getBadgeValue', () => {
    it('should return index + 1 when groupRowsBy is not set', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { groupRowsBy: unknown }).groupRowsBy = undefined;
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'age';
      expect(component.getBadgeValue()).toBe(2);
    });

    it('should return index (0-based) when groupRowsBy is set', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { groupRowsBy: unknown }).groupRowsBy = 'category';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'age';
      expect(component.getBadgeValue()).toBe(1);
    });

    it('should return 0 when field is not in multiSortMeta', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = undefined;
      component.field = 'name';
      expect(component.getBadgeValue()).toBe(0);
    });
  });

  describe('isMultiSorted', () => {
    it('should return false when sortMode is single', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      expect(component.isMultiSorted()).toBe(false);
    });

    it('should return false when sortMode is multiple but field not found', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'age', order: 1 }
      ];
      component.field = 'name';
      expect(component.isMultiSorted()).toBe(false);
    });

    it('should return true when sortMode is multiple and field found in multi-entry metadata', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'name';
      expect(component.isMultiSorted()).toBe(true);
    });
  });

  describe('onKeydown', () => {
    let event: Event;

    beforeEach(() => {
      event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as unknown as Event;
    });

    it('should call preventDefault', () => {
      component.onKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call stopPropagation', () => {
      component.onKeydown(event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call tableInstance.sort with the current field', () => {
      component.field = 'name';
      component.onKeydown(event);
      expect(jest.mocked(mockTable.sort)).toHaveBeenCalledWith({
        field: 'name'
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from sortSource$', () => {
      jest.spyOn(component.subscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should stop reacting to sortSource$ after destroy', () => {
      component.ngOnDestroy();
      jest.spyOn(component, 'updateSortState');
      sortSourceSubject.next(null);
      expect(component.updateSortState).not.toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should render sort-unsorted when sortOrder is 0', () => {
      component.sortOrder = 0;
      component.cd.markForCheck();
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.sort-unsorted')
      ).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.sort-desc')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sort-asc')).toBeNull();
    });

    it('should render sort-desc when sortOrder is 1', () => {
      component.sortOrder = 1;
      component.cd.markForCheck();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sort-desc')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.sort-unsorted')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sort-asc')).toBeNull();
    });

    it('should render sort-asc when sortOrder is -1', () => {
      component.sortOrder = -1;
      component.cd.markForCheck();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sort-asc')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.sort-unsorted')).toBeNull();
      expect(fixture.nativeElement.querySelector('.sort-desc')).toBeNull();
    });

    it('should not render badge when not multi-sorted', () => {
      (mockTable as { sortMode: string }).sortMode = 'single';
      component.cd.markForCheck();
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.cps-sortable-column-badge')
      ).toBeNull();
    });

    it('should render badge with 1-based index when multi-sorted', () => {
      (mockTable as { sortMode: string }).sortMode = 'multiple';
      (mockTable as { _multiSortMeta: unknown })._multiSortMeta = [
        { field: 'name', order: 1 },
        { field: 'age', order: -1 }
      ];
      component.field = 'name';
      component.cd.markForCheck();
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector(
        '.cps-sortable-column-badge'
      );
      expect(badge).toBeTruthy();
      expect(badge.textContent.trim()).toBe('1');
    });
  });
});
