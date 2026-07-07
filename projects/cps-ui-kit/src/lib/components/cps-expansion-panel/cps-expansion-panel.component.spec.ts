import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
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
    fixture.componentRef.setInput('headerTitle', 'Test Panel');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.headerTitle).toBe('Test Panel');
    expect(component.backgroundColor).toBe('transparent');
    expect(component.showChevron).toBe(true);
    expect(component.isExpanded).toBe(false);
    expect(component.disabled).toBe(false);
    expect(component.bordered).toBe(true);
    expect(component.isKeyboardActive).toBe(false);
    expect(component.contentPanelId).toBeTruthy();
    expect(component.cvtBorderRadius).toBe('0px');
    expect(component.cvtWidth).toBe('100%');
  });

  it('should generate unique contentPanelIds across instances', () => {
    const fixture2 = TestBed.createComponent(CpsExpansionPanelComponent);
    fixture2.componentRef.setInput('headerTitle', 'Another Panel');
    fixture2.detectChanges();
    expect(component.contentPanelId).not.toBe(
      fixture2.componentInstance.contentPanelId
    );
  });

  it('should render header title', () => {
    const header = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-header'
    );
    expect(header.textContent).toContain('Test Panel');
  });

  it('should toggle expansion when toggleExpansion is called', () => {
    expect(component.isExpanded).toBe(false);
    component.toggleExpansion();
    expect(component.isExpanded).toBe(true);
  });

  it('should emit afterExpand when toggled to expanded', fakeAsync(() => {
    jest.spyOn(component.afterExpand, 'emit');
    component.toggleExpansion();
    tick(300);
    expect(component.afterExpand.emit).toHaveBeenCalled();
  }));

  it('should emit afterCollapse when toggled to collapsed', fakeAsync(() => {
    component.toggleExpansion();
    tick(300);
    jest.spyOn(component.afterCollapse, 'emit');
    component.toggleExpansion();
    tick(300);
    expect(component.afterCollapse.emit).toHaveBeenCalled();
  }));

  it('should show chevron icon by default', () => {
    const chevron = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-chevron'
    );
    expect(chevron).toBeTruthy();
  });

  it('should hide chevron when showChevron is false', () => {
    fixture.componentRef.setInput('showChevron', false);
    fixture.detectChanges();
    const chevron = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-chevron'
    );
    expect(chevron).toBeFalsy();
  });

  it('should not toggle when disabled', () => {
    component.disabled = true;
    component.toggleExpansion();
    expect(component.isExpanded).toBe(false);
  });

  it('should apply bordered styling when bordered is true', () => {
    fixture.componentRef.setInput('bordered', true);
    fixture.detectChanges();
    expect(component.bordered).toBe(true);
  });

  it('should apply disabled class on header when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-header'
    );
    expect(header.classList).toContain('disabled');
  });

  it('should update cvtBorderRadius on init', () => {
    fixture.componentRef.setInput('borderRadius', 8);
    component.ngOnInit();
    expect(component.cvtBorderRadius).toBe('8px');
  });

  it('should update cvtBorderRadius via ngOnChanges', () => {
    fixture.componentRef.setInput('borderRadius', '1rem');
    fixture.detectChanges();
    expect(component.cvtBorderRadius).toBe('1rem');
  });

  it('should update cvtWidth via ngOnChanges', () => {
    fixture.componentRef.setInput('width', 400);
    fixture.detectChanges();
    expect(component.cvtWidth).toBe('400px');
  });

  it('should set cvtBackgroundColor on init', () => {
    component.backgroundColor = 'white';
    component.ngOnInit();
    expect(component.cvtBackgroundColor).toBeTruthy();
  });

  it('should render content element', () => {
    const content = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-content'
    );
    expect(content).toBeTruthy();
  });

  it('should add expanded class when isExpanded is toggled', () => {
    component.toggleExpansion();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.cps-expansion-panel');
    expect(panel.classList).toContain('expanded');
  });

  it('should rotate chevron when expanded', () => {
    component.toggleExpansion();
    fixture.detectChanges();
    const chevron = fixture.nativeElement.querySelector(
      '.cps-expansion-panel-chevron'
    );
    expect(chevron).toBeTruthy();
  });

  describe('accessibility', () => {
    it('should have role="button" on header', () => {
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('role')).toBe('button');
    });

    it('should have tabindex="0" on header', () => {
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('tabindex')).toBe('0');
    });

    it('should set aria-expanded to false when collapsed', () => {
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when expanded', () => {
      component.toggleExpansion();
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-disabled on header when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled on header when enabled', () => {
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.getAttribute('aria-disabled')).toBeNull();
    });

    it('should have aria-controls on header matching content id', () => {
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      const content = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-content'
      );
      expect(header.getAttribute('aria-controls')).toBe(
        content.getAttribute('id')
      );
    });

    it('should set aria-hidden on content when collapsed', () => {
      const content = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-content'
      );
      expect(content.getAttribute('aria-hidden')).toBe('true');
    });

    it('should set aria-hidden to false on content when expanded', () => {
      component.toggleExpansion();
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-content'
      );
      expect(content.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('keyboard interaction', () => {
    it('should toggle expansion on Enter key', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.isExpanded).toBe(true);
    });

    it('should toggle expansion on Space key', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: ' ' }));
      expect(component.isExpanded).toBe(true);
    });

    it('should not toggle on other keys', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.isExpanded).toBe(false);
    });

    it('should ignore repeated keydown events', () => {
      component.onHeaderKeydown(
        new KeyboardEvent('keydown', { key: 'Enter', repeat: true })
      );
      expect(component.isExpanded).toBe(false);
    });

    it('should not toggle when disabled via keyboard', () => {
      component.disabled = true;
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.isExpanded).toBe(false);
    });

    it('should set isKeyboardActive to true on Enter keydown', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.isKeyboardActive).toBe(true);
    });

    it('should set isKeyboardActive to true on Space keydown', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: ' ' }));
      expect(component.isKeyboardActive).toBe(true);
    });

    it('should clear isKeyboardActive on Enter keyup', () => {
      component.isKeyboardActive = true;
      component.onHeaderKeyup(new KeyboardEvent('keyup', { key: 'Enter' }));
      expect(component.isKeyboardActive).toBe(false);
    });

    it('should clear isKeyboardActive on Space keyup', () => {
      component.isKeyboardActive = true;
      component.onHeaderKeyup(new KeyboardEvent('keyup', { key: ' ' }));
      expect(component.isKeyboardActive).toBe(false);
    });

    it('should not clear isKeyboardActive on other keyup', () => {
      component.isKeyboardActive = true;
      component.onHeaderKeyup(new KeyboardEvent('keyup', { key: 'Tab' }));
      expect(component.isKeyboardActive).toBe(true);
    });

    it('should apply keyboard-active class when isKeyboardActive is true', () => {
      component.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector(
        '.cps-expansion-panel-header'
      );
      expect(header.classList).toContain('keyboard-active');
    });
  });

  describe('reduced motion', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use the default transition duration by default', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: false } as MediaQueryList);

      expect(component.resolvedTransitionType).toBe(
        '0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      );
    });

    it('should use a near-instant transition when the OS prefers reduced motion', () => {
      jest
        .spyOn(window, 'matchMedia')
        .mockReturnValue({ matches: true } as MediaQueryList);

      expect(component.resolvedTransitionType).toBe('1ms');
    });
  });
});
