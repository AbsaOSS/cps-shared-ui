import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UwtDiagnosticsJsonComponent } from './uwt-diagnostics-json.component';

describe('UwtDiagnosticsJsonComponent', () => {
  let fixture: ComponentFixture<UwtDiagnosticsJsonComponent>;
  const pre = () => fixture.nativeElement.querySelector('pre') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UwtDiagnosticsJsonComponent, NoopAnimationsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(UwtDiagnosticsJsonComponent);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should show the payload as indented JSON in a named, focusable region', () => {
    fixture.componentRef.setInput('value', { a: { b: 1 } });
    fixture.componentRef.setInput('label', 'Payload of event #3');
    fixture.detectChanges();

    expect(JSON.parse(pre().textContent ?? '')).toEqual({ a: { b: 1 } });
    expect(pre().textContent).toContain('\n  "a"');
    expect(pre().getAttribute('aria-label')).toBe('Payload of event #3');
    expect(pre().getAttribute('tabindex')).toBe('0');
  });

  it('should truncate a huge payload in view, and say so', () => {
    fixture.componentRef.setInput('value', { big: 'x'.repeat(100_000) });
    fixture.componentRef.setInput('maxChars', 1000);
    fixture.detectChanges();

    expect(pre().textContent!.length).toBe(64 * 1024);
    expect(fixture.nativeElement.textContent).toContain(
      'showing the first 65,536 characters'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'The download contains all of it.'
    );
  });

  it('should measure the limit in characters, not bytes', () => {
    // 600 Cyrillic letters: about 600 characters of JSON, but 1,200+ bytes.
    fixture.componentRef.setInput('value', { text: 'ж'.repeat(600) });
    fixture.componentRef.setInput('maxChars', 1000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Large payload');
    expect(pre().textContent).toContain('ж'.repeat(600));
  });

  it('should not cut a truncated view through the middle of a surrogate pair', () => {
    const before = '{\n  "big": "';
    // Lines the first emoji up so the cut would fall inside it.
    const padding = 'x'.repeat(64 * 1024 - 1 - before.length);
    fixture.componentRef.setInput('value', {
      big: padding + '😀'.repeat(10)
    });
    fixture.componentRef.setInput('maxChars', 1000);
    fixture.detectChanges();

    const shown = pre().textContent!;
    expect(shown.length).toBe(64 * 1024 - 1);
    expect(shown.endsWith('x')).toBe(true);
  });

  it('should render a circular value instead of failing', () => {
    const value: Record<string, unknown> = { a: 1 };
    value.self = value;
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    expect(pre().textContent).toContain('"[Circular]"');
  });

  it('should copy the full JSON', async () => {
    const writeText = jest.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    fixture.componentRef.setInput('value', { a: 1 });
    fixture.detectChanges();

    await (
      fixture.componentInstance as unknown as { copy(): Promise<void> }
    ).copy();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}');
    expect(fixture.nativeElement.textContent).toContain('Payload copied');
  });
});
