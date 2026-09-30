import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsDiagnosticsJsonComponent } from './cps-diagnostics-json.component';

describe('CpsDiagnosticsJsonComponent', () => {
  let fixture: ComponentFixture<CpsDiagnosticsJsonComponent>;
  const pre = () => fixture.nativeElement.querySelector('pre') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsDiagnosticsJsonComponent, NoopAnimationsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(CpsDiagnosticsJsonComponent);
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
      'The download contains all of it.'
    );
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
