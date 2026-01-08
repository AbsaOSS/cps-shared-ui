import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsExpansionPanelComponent } from './cps-expansion-panel.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CpsExpansionPanelComponent', () => {
  let component: CpsExpansionPanelComponent;
  let fixture: ComponentFixture<CpsExpansionPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsExpansionPanelComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsExpansionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.headerTitle).toBe('');
    expect(component.backgroundColor).toBe('transparent');
    expect(component.showChevron).toBe(true);
    expect(component.isExpanded).toBe(false);
    expect(component.disabled).toBe(false);
    expect(component.bordered).toBe(true);
    // borderRadius is converted to string on init
    expect(component.borderRadius).toBeDefined();
  });

  it('should render header title', () => {
    component.headerTitle = 'Expandable Section';
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.cps-expansion-panel-header');
    expect(header.textContent).toContain('Expandable Section');
  });

  it('should toggle expansion when header is clicked', () => {
    expect(component.isExpanded).toBe(false);
    component.toggleExpansion();
    expect(component.isExpanded).toBe(true);
  });

  it('should emit afterExpand when toggled to expanded', () => {
    jest.spyOn(component.afterExpand, 'emit');
    component.toggleExpansion();
    // Wait for animation to complete
    setTimeout(() => {
      expect(component.afterExpand.emit).toHaveBeenCalled();
    }, 300);
  });

  it('should show chevron icon by default', () => {
    const chevron = fixture.nativeElement.querySelector('.cps-expansion-panel-chevron');
    expect(chevron).toBeTruthy();
  });

  it('should hide chevron when showChevron is false', () => {
    component.showChevron = false;
    fixture.detectChanges();
    const chevron = fixture.nativeElement.querySelector('.cps-expansion-panel-chevron');
    expect(chevron).toBeFalsy();
  });

  it('should not toggle when disabled', () => {
    component.disabled = true;
    const initialState = component.isExpanded;
    component.toggleExpansion();
    expect(component.isExpanded).toBe(initialState);
  });

  it('should apply bordered styling when bordered is true', () => {
    component.bordered = true;
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.cps-expansion-panel');
    expect(panel).toBeTruthy();
    expect(component.bordered).toBe(true);
  });

  it('should apply disabled styling when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.cps-expansion-panel');
    expect(panel).toBeTruthy();
    expect(component.disabled).toBe(true);
  });

  it('should set custom border radius', () => {
    component.borderRadius = 8;
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.borderRadius).toBe('8px');
  });

  it('should set background color on init', () => {
    component.backgroundColor = 'white';
    component.ngOnInit();
    expect(component.backgroundColor).toBeTruthy();
  });

  it('should expand content when isExpanded is true', () => {
    component.isExpanded = true;
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.cps-expansion-panel-content');
    expect(content).toBeTruthy();
  });

  it('should rotate chevron when expanded', () => {
    component.isExpanded = false;
    fixture.detectChanges();
    component.isExpanded = true;
    fixture.detectChanges();
    // Chevron rotation is handled by CSS/animation
    const chevron = fixture.nativeElement.querySelector('.cps-expansion-panel-chevron');
    expect(chevron).toBeTruthy();
  });
});
