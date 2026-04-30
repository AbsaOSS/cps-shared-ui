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
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('defaults to the preview tab', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();
      expect(component.activeTab()).toBe('preview');
    });

    it('renders the label when provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('label', 'My example');
      fixture.detectChanges();
      const heading = fixture.debugElement.query(
        By.css('.code-example__label')
      );
      expect(heading.nativeElement.textContent.trim()).toBe('My example');
    });

    it('does not render a label element when label is empty', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();
      const heading = fixture.debugElement.query(
        By.css('.code-example__label')
      );
      expect(heading).toBeNull();
    });

    it('shows only Preview and HTML tabs when tsCode is not provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();
      const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
      expect(tabs.length).toBe(2);
      expect(tabs[0].nativeElement.textContent.trim()).toBe('Preview');
      expect(tabs[1].nativeElement.textContent.trim()).toBe('HTML');
    });

    it('shows a TypeScript tab when tsCode is provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
      const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
      expect(tabs.length).toBe(3);
      expect(tabs[2].nativeElement.textContent.trim()).toBe('TS');
    });

    it('shows only Preview and TS tabs when only tsCode is provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
      const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
      expect(tabs.length).toBe(2);
      expect(tabs[0].nativeElement.textContent.trim()).toBe('Preview');
      expect(tabs[1].nativeElement.textContent.trim()).toBe('TS');
    });

    it('does not render HTML code panel when htmlCode is not provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
      const htmlPanel = fixture.debugElement.query(
        By.css('[id*="-panel-html"]')
      );
      expect(htmlPanel).toBeNull();
    });

    it('does not render TS code panel when tsCode is not provided', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();
      const tsPanel = fixture.debugElement.query(By.css('[id*="-panel-ts"]'));
      expect(tsPanel).toBeNull();
    });
  });

  describe('tab switching', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
    });

    it('switches to HTML tab on click', () => {
      const htmlTab = fixture.debugElement.queryAll(By.css('[role="tab"]'))[1];
      htmlTab.nativeElement.click();
      fixture.detectChanges();
      expect(component.activeTab()).toBe('html');
    });

    it('switches to TypeScript tab on click', () => {
      const tsTab = fixture.debugElement.queryAll(By.css('[role="tab"]'))[2];
      tsTab.nativeElement.click();
      fixture.detectChanges();
      expect(component.activeTab()).toBe('ts');
    });

    it('switches back to Preview tab on click', () => {
      component.activeTab.set('html');
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
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
    });

    it('moves to the next tab on ArrowRight', () => {
      component.activeTab.set('preview');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      jest.spyOn(event, 'preventDefault');
      component.navigateTabs(event);
      expect(component.activeTab()).toBe('html');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('moves to the previous tab on ArrowLeft', () => {
      component.activeTab.set('html');
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

      fixture.componentRef.setInput('htmlCode', '<div>html</div>');
      fixture.componentRef.setInput('tsCode', 'const x = 1;');
      fixture.detectChanges();
    });

    it('copies HTML code when on the HTML tab and sets copied signal', async () => {
      writeTextMock.mockResolvedValue(undefined);
      component.activeTab.set('html');

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

  describe('tabindex', () => {
    it('preview tabpanel has tabindex -1 by default (interactive content)', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.detectChanges();

      const previewPanel = fixture.debugElement.query(
        By.css('[id*="-panel-preview"]')
      );
      expect(previewPanel.nativeElement.tabIndex).toBe(-1);
    });

    it('preview tabpanel has tabindex 0 when isPreviewNonInteractive is true', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('isPreviewNonInteractive', true);
      fixture.detectChanges();

      const previewPanel = fixture.debugElement.query(
        By.css('[id*="-panel-preview"]')
      );
      expect(previewPanel.nativeElement.tabIndex).toBe(0);
    });

    it('preview tabpanel tabindex updates reactively when input changes', () => {
      fixture = TestBed.createComponent(CodeExampleComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('htmlCode', '<div></div>');
      fixture.componentRef.setInput('isPreviewNonInteractive', false);
      fixture.detectChanges();

      const previewPanel = fixture.debugElement.query(
        By.css('[id*="-panel-preview"]')
      );
      expect(previewPanel.nativeElement.tabIndex).toBe(-1);

      fixture.componentRef.setInput('isPreviewNonInteractive', true);
      fixture.detectChanges();
      expect(previewPanel.nativeElement.tabIndex).toBe(0);
    });
  });
});
