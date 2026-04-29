import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CodeExampleComponent } from './code-example.component';

describe('CodeExampleComponent', () => {
  let component: CodeExampleComponent;
  let fixture: ComponentFixture<CodeExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeExampleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CodeExampleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialisation', () => {
    it('should create', () => {
      component.code = '<div></div>';
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('defaults to the preview tab', () => {
      component.code = '<div></div>';
      fixture.detectChanges();
      expect(component.activeTab()).toBe('preview');
    });

    it('renders the label when provided', () => {
      component.code = '<div></div>';
      component.label = 'My example';
      fixture.detectChanges();
      const heading = fixture.debugElement.query(
        By.css('.code-example__label')
      );
      expect(heading.nativeElement.textContent.trim()).toBe('My example');
    });

    it('does not render a label element when label is empty', () => {
      component.code = '<div></div>';
      fixture.detectChanges();
      const heading = fixture.debugElement.query(
        By.css('.code-example__label')
      );
      expect(heading).toBeNull();
    });

    it('shows only Preview and HTML tabs when tsCode is not provided', () => {
      component.code = '<div></div>';
      fixture.detectChanges();
      const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
      expect(tabs.length).toBe(2);
      expect(tabs[0].nativeElement.textContent.trim()).toBe('Preview');
      expect(tabs[1].nativeElement.textContent.trim()).toBe('HTML');
    });

    it('shows a TypeScript tab when tsCode is provided', () => {
      component.code = '<div></div>';
      component.tsCode = 'const x = 1;';
      fixture.detectChanges();
      const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
      expect(tabs.length).toBe(3);
      expect(tabs[2].nativeElement.textContent.trim()).toBe('TS');
    });
  });

  describe('tab switching', () => {
    beforeEach(() => {
      component.code = '<div></div>';
      component.tsCode = 'const x = 1;';
      fixture.detectChanges();
    });

    it('switches to HTML tab on click', () => {
      const htmlTab = fixture.debugElement.queryAll(By.css('[role="tab"]'))[1];
      htmlTab.nativeElement.click();
      fixture.detectChanges();
      expect(component.activeTab()).toBe('code');
    });

    it('switches to TypeScript tab on click', () => {
      const tsTab = fixture.debugElement.queryAll(By.css('[role="tab"]'))[2];
      tsTab.nativeElement.click();
      fixture.detectChanges();
      expect(component.activeTab()).toBe('ts');
    });

    it('switches back to Preview tab on click', () => {
      component.activeTab.set('code');
      fixture.detectChanges();
      const previewTab = fixture.debugElement.queryAll(
        By.css('[role="tab"]')
      )[0];
      previewTab.nativeElement.click();
      fixture.detectChanges();
      expect(component.activeTab()).toBe('preview');
    });
  });

  describe('navigateTabs', () => {
    beforeEach(() => {
      component.code = '<div></div>';
      component.tsCode = 'const x = 1;';
      fixture.detectChanges();
    });

    it('moves to the next tab on ArrowRight', () => {
      component.activeTab.set('preview');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      jest.spyOn(event, 'preventDefault');
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('code');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('moves to the previous tab on ArrowLeft', () => {
      component.activeTab.set('code');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      jest.spyOn(event, 'preventDefault');
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('preview');
    });

    it('jumps to the first tab on Home', () => {
      component.activeTab.set('ts');
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('preview');
    });

    it('jumps to the last tab on End', () => {
      component.activeTab.set('preview');
      const event = new KeyboardEvent('keydown', { key: 'End' });
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('ts');
    });

    it('wraps from last to first tab on ArrowRight', () => {
      component.activeTab.set('ts');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('preview');
    });

    it('wraps from first to last tab on ArrowLeft', () => {
      component.activeTab.set('preview');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('ts');
    });

    it('does nothing for unhandled keys', () => {
      component.activeTab.set('preview');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('preview');
    });
  });

  describe('copyCode', () => {
    let writeTextMock: jest.Mock;

    beforeEach(() => {
      writeTextMock = jest.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true
      });

      component.code = '<div>html</div>';
      component.tsCode = 'const x = 1;';
      fixture.detectChanges();
    });

    it('copies HTML code when on the HTML tab and sets copied signal', async () => {
      writeTextMock.mockResolvedValue(undefined);
      component.activeTab.set('code');

      await component.copyCode();

      expect(writeTextMock).toHaveBeenCalledWith('<div>html</div>');
      expect(component.copied()).toBe(true);
    });

    it('copies TypeScript code when on the TS tab', async () => {
      writeTextMock.mockResolvedValue(undefined);
      component.activeTab.set('ts');

      await component.copyCode();

      expect(writeTextMock).toHaveBeenCalledWith('const x = 1;');
    });

    it('sets copyFailed when clipboard write rejects', async () => {
      writeTextMock.mockRejectedValue(new Error('denied'));

      await component.copyCode();

      expect(component.copyFailed()).toBe(true);
      expect(component.copied()).toBe(false);
    });
  });
});
