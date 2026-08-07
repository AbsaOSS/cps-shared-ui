import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CpsLoaderComponent } from './cps-loader.component';
import { CPS_LIVE_ANNOUNCER_SERVICE } from '../../services/cps-live-announcer/cps-live-announcer.service';

describe('CpsLoaderComponent', () => {
  let component: CpsLoaderComponent;
  let fixture: ComponentFixture<CpsLoaderComponent>;
  let mockAnnouncer: { announce: jest.Mock };

  beforeEach(async () => {
    mockAnnouncer = { announce: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [CpsLoaderComponent],
      providers: [
        { provide: CPS_LIVE_ANNOUNCER_SERVICE, useValue: mockAnnouncer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CpsLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.fullScreen).toBe(false);
    expect(component.opacity).toBe(0.1);
    expect(component.labelColor).toBeTruthy();
    expect(component.showLabel).toBe(true);
    expect(component.label).toBe('Loading...');
    expect(component.ariaLabel).toBe('Loading');
    expect(component.doneAriaLabel).toBe('Loading complete');
  });

  it('should display loading label by default', () => {
    const label = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-text'
    );
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Loading...');
  });

  it('should hide loading label when showLabel is false', () => {
    fixture.componentRef.setInput('showLabel', false);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-text'
    );
    expect(label).toBeFalsy();
  });

  it('should apply fullScreen styling when fullScreen is true', () => {
    fixture.componentRef.setInput('fullScreen', true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.cps-loader-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should set background color with custom opacity', () => {
    component.opacity = 0.5;
    component.ngOnInit();
    expect(component.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('should convert label color on init', () => {
    fixture.componentRef.setInput('labelColor', 'primary');
    fixture.detectChanges();
    expect(component.labelColor).toBeTruthy();
  });

  it('should display spinner', () => {
    const spinner = fixture.nativeElement.querySelector(
      '.cps-loader-overlay-content-circles'
    );
    expect(spinner).toBeTruthy();
  });

  it('should have correct default opacity', () => {
    expect(component.backgroundColor).toContain('0.1');
  });

  describe('Accessibility (a11y)', () => {
    it('should NOT have aria-label on the overlay', () => {
      const overlay = fixture.nativeElement.querySelector(
        '.cps-loader-overlay'
      );
      expect(overlay.getAttribute('aria-label')).toBeNull();
    });

    it('should have aria-busy="true" on the host element', () => {
      expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
    });

    it('should render the loading text as a span, not a label element', () => {
      const span = fixture.nativeElement.querySelector(
        'span.cps-loader-overlay-content-text'
      );
      const labelEl = fixture.nativeElement.querySelector(
        'label.cps-loader-overlay-content-text'
      );
      expect(span).toBeTruthy();
      expect(labelEl).toBeFalsy();
    });

    it('should render the label input text in the visible span', () => {
      fixture.componentRef.setInput('label', 'Saving...');
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector(
        '.cps-loader-overlay-content-text'
      );
      expect(span.textContent.trim()).toBe('Saving...');
    });

    it('should have aria-hidden="true" on the circles container', () => {
      const circles = fixture.nativeElement.querySelector(
        '.cps-loader-overlay-content-circles'
      );
      expect(circles.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-hidden="true" on the visible text span', () => {
      const span = fixture.nativeElement.querySelector(
        '.cps-loader-overlay-content-text'
      );
      expect(span.getAttribute('aria-hidden')).toBe('true');
    });

    describe('live announcements', () => {
      it('should announce label text on init', () => {
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Loading...');
      });

      it('should announce ariaLabel when showLabel is false', () => {
        mockAnnouncer.announce.mockClear();
        fixture.componentRef.setInput('showLabel', false);
        component.ngAfterViewInit();
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Loading');
      });

      it('should announce ariaLabel when label is empty', () => {
        mockAnnouncer.announce.mockClear();
        fixture.componentRef.setInput('label', '');
        component.ngAfterViewInit();
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Loading');
      });

      it('should announce custom ariaLabel', () => {
        mockAnnouncer.announce.mockClear();
        fixture.componentRef.setInput('showLabel', false);
        fixture.componentRef.setInput('ariaLabel', 'Saving...');
        component.ngAfterViewInit();
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Saving...');
      });

      it('should announce doneAriaLabel on destroy', () => {
        mockAnnouncer.announce.mockClear();
        fixture.destroy();
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Loading complete');
      });

      it('should announce custom doneAriaLabel on destroy', () => {
        fixture.componentRef.setInput('doneAriaLabel', 'Saving complete');
        mockAnnouncer.announce.mockClear();
        fixture.destroy();
        expect(mockAnnouncer.announce).toHaveBeenCalledWith('Saving complete');
      });

      it('should NOT announce on destroy when doneAriaLabel is empty', () => {
        fixture.componentRef.setInput('doneAriaLabel', '');
        mockAnnouncer.announce.mockClear();
        fixture.destroy();
        expect(mockAnnouncer.announce).not.toHaveBeenCalled();
      });
    });

    describe('logMissingAriaLabelError', () => {
      let errorFixture: ComponentFixture<CpsLoaderComponent>;

      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        errorFixture = TestBed.createComponent(CpsLoaderComponent);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should not log error by default', () => {
        errorFixture.detectChanges();
        expect(console.error).not.toHaveBeenCalled();
      });

      it('should log error on init when both label and ariaLabel are empty', () => {
        errorFixture.componentRef.setInput('label', '');
        errorFixture.componentRef.setInput('ariaLabel', '');
        errorFixture.detectChanges();
        expect(console.error).toHaveBeenCalledWith(
          'CpsLoaderComponent: unlabeled component must have an ariaLabel for accessibility.'
        );
      });

      it('should log error on init when both label and ariaLabel are whitespace only', () => {
        errorFixture.componentRef.setInput('label', '   ');
        errorFixture.componentRef.setInput('ariaLabel', '   ');
        errorFixture.detectChanges();
        expect(console.error).toHaveBeenCalledWith(
          'CpsLoaderComponent: unlabeled component must have an ariaLabel for accessibility.'
        );
      });

      it('should not log error when label is set and ariaLabel is empty', () => {
        errorFixture.componentRef.setInput('ariaLabel', '');
        errorFixture.detectChanges();
        expect(console.error).not.toHaveBeenCalled();
      });

      it('should not log error when ariaLabel is set and label is empty', () => {
        errorFixture.componentRef.setInput('label', '');
        errorFixture.detectChanges();
        expect(console.error).not.toHaveBeenCalled();
      });

      it('should log error on ngOnChanges when both label and ariaLabel become empty', () => {
        errorFixture.detectChanges();
        jest.clearAllMocks();
        errorFixture.componentRef.setInput('label', '');
        errorFixture.componentRef.setInput('ariaLabel', '');
        errorFixture.detectChanges();
        expect(console.error).toHaveBeenCalledWith(
          'CpsLoaderComponent: unlabeled component must have an ariaLabel for accessibility.'
        );
      });

      it('should not log error on ngOnChanges when ariaLabel is set while label is empty', () => {
        errorFixture.componentRef.setInput('label', '');
        errorFixture.componentRef.setInput('ariaLabel', '');
        errorFixture.detectChanges();
        jest.clearAllMocks();
        errorFixture.componentRef.setInput('ariaLabel', 'Loading...');
        errorFixture.detectChanges();
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });
});
