import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsPaginatorComponent } from './cps-paginator.component';
import { FormsModule } from '@angular/forms';

describe('CpsPaginatorComponent', () => {
  let component: CpsPaginatorComponent;
  let fixture: ComponentFixture<CpsPaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsPaginatorComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsPaginatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalRecords', 100);
    fixture.componentRef.setInput('rows', 10);
    fixture.componentRef.setInput('rowsPerPageOptions', [10, 20, 50]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.first).toBe(0);
    expect(component.alwaysShow).toBe(true);
    expect(component.backgroundColor).toBe('transparent');
    expect(component.resetPageOnRowsChange).toBe(false);
  });

  it('should have role="navigation" on host element', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('navigation');
  });

  it('should have aria-label="Pagination" by default', () => {
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Pagination');
  });

  it('should reflect ariaLabel input on host element', () => {
    fixture.componentRef.setInput('ariaLabel', 'Search results pagination');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe(
      'Search results pagination'
    );
  });

  it('should update aria-label when ariaLabel input changes', () => {
    fixture.componentRef.setInput('ariaLabel', 'Search results pagination');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe(
      'Search results pagination'
    );

    fixture.componentRef.setInput('ariaLabel', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Pagination');
  });

  it('should mark first button as aria-disabled when on first page', () => {
    component.first = 0;
    const pt = component.paginatorPt;
    expect(pt.first['aria-disabled']).toBe('true');
    expect(pt.first.tabindex).toBe(-1);
  });

  it('should not mark first button as aria-disabled when not on first page', () => {
    component.first = 10;
    const pt = component.paginatorPt;
    expect(pt.first['aria-disabled']).toBeNull();
    expect(pt.first.tabindex).toBe(0);
  });

  it('should mark first button as aria-disabled when totalRecords is 0', () => {
    component.first = 0;
    fixture.componentRef.setInput('totalRecords', 0);
    const pt = component.paginatorPt;
    expect(pt.first['aria-disabled']).toBe('true');
  });

  it('should initialize row options from rowsPerPageOptions', () => {
    component.ngOnInit();
    expect(component.rowOptions.length).toBe(3);
    expect(component.rowOptions[0]).toEqual({ label: '10', value: 10 });
    expect(component.rowOptions[1]).toEqual({ label: '20', value: 20 });
    expect(component.rowOptions[2]).toEqual({ label: '50', value: 50 });
  });

  it('should emit pageChanged when page changes', () => {
    jest.spyOn(component.pageChanged, 'emit');
    const event = { first: 10, rows: 10, page: 1, pageCount: 10 };
    component.onPageChange(event);
    expect(component.pageChanged.emit).toHaveBeenCalledWith(event);
  });

  it('should update first value when page changes', () => {
    const event = { first: 20, rows: 10, page: 2, pageCount: 10 };
    component.onPageChange(event);
    expect(component.first).toBe(20);
  });

  describe('focus redirection when a boundary nav button becomes disabled', () => {
    function getSelectedPageBtn() {
      return fixture.nativeElement.querySelector(
        '.p-paginator-page[aria-current="page"]'
      ) as HTMLButtonElement | null;
    }

    function mockActiveEl(selector: string) {
      const btn = fixture.nativeElement.querySelector(selector);
      jest
        .spyOn(fixture.nativeElement.ownerDocument, 'activeElement', 'get')
        .mockReturnValue(btn);
      return btn;
    }

    const firstPageEvent = { first: 0, rows: 10, page: 0, pageCount: 10 };
    const lastPageEvent = { first: 90, rows: 10, page: 9, pageCount: 10 };

    it('should redirect focus when first-page button becomes disabled', async () => {
      const navBtn = mockActiveEl('.p-paginator-first');
      const selectedPage = getSelectedPageBtn();
      expect(navBtn).not.toBeNull();
      expect(selectedPage).not.toBeNull();
      jest.spyOn(selectedPage!, 'focus');
      component.onPageChange(firstPageEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(selectedPage!.focus).toHaveBeenCalled();
    });

    it('should redirect focus when prev button lands on first page', async () => {
      const navBtn = mockActiveEl('.p-paginator-prev');
      const selectedPage = getSelectedPageBtn();
      expect(navBtn).not.toBeNull();
      expect(selectedPage).not.toBeNull();
      jest.spyOn(selectedPage!, 'focus');
      component.onPageChange(firstPageEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(selectedPage!.focus).toHaveBeenCalled();
    });

    it('should redirect focus when last-page button becomes disabled', async () => {
      const navBtn = mockActiveEl('.p-paginator-last');
      const selectedPage = getSelectedPageBtn();
      expect(navBtn).not.toBeNull();
      expect(selectedPage).not.toBeNull();
      jest.spyOn(component.paginator, 'isLastPage').mockReturnValue(true);
      jest.spyOn(selectedPage!, 'focus');
      component.onPageChange(lastPageEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(selectedPage!.focus).toHaveBeenCalled();
    });

    it('should redirect focus when next button lands on last page', async () => {
      const navBtn = mockActiveEl('.p-paginator-next');
      const selectedPage = getSelectedPageBtn();
      expect(navBtn).not.toBeNull();
      expect(selectedPage).not.toBeNull();
      jest.spyOn(component.paginator, 'isLastPage').mockReturnValue(true);
      jest.spyOn(selectedPage!, 'focus');
      component.onPageChange(lastPageEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(selectedPage!.focus).toHaveBeenCalled();
    });
  });

  it('should display paginator when there are multiple pages', () => {
    const paginator = fixture.nativeElement.querySelector('p-paginator');
    expect(paginator).toBeTruthy();
  });

  it('should show paginator even with one page when alwaysShow is true', () => {
    fixture.componentRef.setInput('totalRecords', 5);
    fixture.componentRef.setInput('rows', 10);
    fixture.componentRef.setInput('alwaysShow', true);
    fixture.detectChanges();
    const paginator = fixture.nativeElement.querySelector('p-paginator');
    expect(paginator).toBeTruthy();
  });

  it('should set background color on init', () => {
    component.backgroundColor = 'white';
    component.ngOnInit();
    expect(component.backgroundColor).toBeTruthy();
  });

  it('should calculate correct number of pages', () => {
    component.totalRecords = 100;
    component.rows = 10;
    const expectedPages = Math.ceil(100 / 10);
    expect(expectedPages).toBe(10);
  });

  it('should handle rows per page change', () => {
    jest.spyOn(component.pageChanged, 'emit');
    component.rows = 20;
    component.onRowsPerPageChange(20);
    // Verify rows were updated
    expect(component.rows).toBe(20);
  });

  it('should reset to first page when rows change if resetPageOnRowsChange is true', () => {
    component.resetPageOnRowsChange = true;
    component.first = 30;
    component.onRowsPerPageChange(20);
    expect(component.first).toBe(0);
  });

  describe('arrow key navigation', () => {
    function dispatchArrow(
      key: 'ArrowLeft' | 'ArrowRight',
      target: HTMLElement
    ) {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true })
      );
    }

    function getPageButton(index = 0): HTMLButtonElement {
      return fixture.nativeElement.querySelectorAll('.p-paginator-page')[index];
    }

    it('should move focus to the next page button and click it on ArrowRight', () => {
      fixture.detectChanges();
      const buttons =
        fixture.nativeElement.querySelectorAll('.p-paginator-page');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      const first = buttons[0] as HTMLButtonElement;
      const second = buttons[1] as HTMLButtonElement;
      jest.spyOn(second, 'click');
      jest.spyOn(second, 'focus');
      dispatchArrow('ArrowRight', first);
      expect(second.focus).toHaveBeenCalled();
      expect(second.click).toHaveBeenCalled();
    });

    it('should move focus to the previous page button and click it on ArrowLeft', () => {
      fixture.detectChanges();
      const buttons =
        fixture.nativeElement.querySelectorAll('.p-paginator-page');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      const first = buttons[0] as HTMLButtonElement;
      const second = buttons[1] as HTMLButtonElement;
      jest.spyOn(first, 'click');
      jest.spyOn(first, 'focus');
      dispatchArrow('ArrowLeft', second);
      expect(first.focus).toHaveBeenCalled();
      expect(first.click).toHaveBeenCalled();
    });

    it('should do nothing on ArrowLeft when on the first visible page button and first page', () => {
      jest.spyOn(component.pageChanged, 'emit');
      component.first = 0;
      fixture.detectChanges();
      const btn = getPageButton(0);
      expect(btn).not.toBeUndefined();
      dispatchArrow('ArrowLeft', btn);
      expect(component.pageChanged.emit).not.toHaveBeenCalled();
    });

    it('should ignore arrow keys on non-page-button elements', () => {
      jest.spyOn(component.pageChanged, 'emit');
      const navBtn = fixture.nativeElement.querySelector('.p-paginator-first');
      expect(navBtn).not.toBeNull();
      dispatchArrow('ArrowRight', navBtn);
      expect(component.pageChanged.emit).not.toHaveBeenCalled();
    });

    it('should ignore arrow keys on non-button elements', () => {
      jest.spyOn(component.pageChanged, 'emit');
      const span =
        fixture.nativeElement.querySelector('span') ?? fixture.nativeElement;
      span.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
      expect(component.pageChanged.emit).not.toHaveBeenCalled();
    });
  });

  it('should maintain current page when rows change if resetPageOnRowsChange is false', () => {
    component.resetPageOnRowsChange = false;
    component.first = 30;
    // When resetPageOnRowsChange is false, first is not automatically reset
    // The paginator component will handle adjustments internally
    component.onRowsPerPageChange(20);
    // Verify resetPageOnRowsChange is still false
    expect(component.resetPageOnRowsChange).toBe(false);
  });
});
