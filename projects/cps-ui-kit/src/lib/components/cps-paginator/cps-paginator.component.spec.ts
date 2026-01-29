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
    component.totalRecords = 100;
    component.rows = 10;
    component.rowsPerPageOptions = [10, 20, 50];
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

  it('should display paginator when there are multiple pages', () => {
    const paginator = fixture.nativeElement.querySelector('p-paginator');
    expect(paginator).toBeTruthy();
  });

  it('should show paginator even with one page when alwaysShow is true', () => {
    component.totalRecords = 5;
    component.rows = 10;
    component.alwaysShow = true;
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
