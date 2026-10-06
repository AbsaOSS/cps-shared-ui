import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UwtDiagnosticsStore } from '../uwt-diagnostics-store/uwt-diagnostics-store';
import { UwtDiagnosticsFilterBarComponent } from './uwt-diagnostics-filter-bar.component';

describe('UwtDiagnosticsFilterBarComponent', () => {
  let fixture: ComponentFixture<UwtDiagnosticsFilterBarComponent>;
  let store: UwtDiagnosticsStore;
  const bar = () =>
    fixture.componentInstance as unknown as {
      builderOpen: { set(v: boolean): void };
      onPath(v: unknown): void;
      onOperator(v: unknown): void;
      value: { set(v: string): void };
      add(): void;
      canAdd(): boolean;
    };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UwtDiagnosticsFilterBarComponent, NoopAnimationsModule],
      providers: [UwtDiagnosticsStore]
    }).compileComponents();
    store = TestBed.inject(UwtDiagnosticsStore);
    fixture = TestBed.createComponent(UwtDiagnosticsFilterBarComponent);
    fixture.componentRef.setInput('section', 'logging');
    fixture.componentRef.setInput('sectionName', 'Logging');
    fixture.detectChanges();
  });

  it('should need a field, and a value unless checking presence', () => {
    bar().builderOpen.set(true);
    fixture.detectChanges();
    expect(bar().canAdd()).toBe(false);

    bar().onPath('metadata.theme');
    expect(bar().canAdd()).toBe(false);
    bar().value.set('dark');
    expect(bar().canAdd()).toBe(true);

    bar().value.set('');
    bar().onOperator('exists');
    expect(bar().canAdd()).toBe(true);
  });

  it('should name its controls after the section', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(
      el
        .querySelector('.uwt-diagnostics-search input')
        ?.getAttribute('aria-label')
    ).toBe('Search Logging events');
  });

  it('should add a filter as a removable chip with a spoken name', () => {
    bar().onPath('metadata.theme');
    bar().onOperator('equals');
    bar().value.set('dark');
    bar().add();
    fixture.detectChanges();

    // Written to this bar's own section only.
    expect(store.filters().bi.fields).toHaveLength(0);
    expect(store.filters().logging.fields).toEqual([
      expect.objectContaining({
        path: 'metadata.theme',
        operator: 'equals',
        value: 'dark'
      })
    ]);
    const close = fixture.nativeElement.querySelector(
      'cps-chip button'
    ) as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe(
      'Remove filter metadata.theme equals "dark"'
    );

    close.click();
    fixture.detectChanges();
    expect(store.filters().logging.fields).toHaveLength(0);
  });

  it('should clear the text and every filter together', () => {
    store.setText('logging', 'x');
    store.addFilter('logging', { path: 'kind', operator: 'exists', value: '' });
    store.setText('bi', 'kept');
    fixture.detectChanges();

    const clearBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    ).find((b) => b.textContent?.trim() === 'Clear filters');
    clearBtn?.click();

    expect(store.filters().logging).toEqual({ text: '', fields: [] });
    // Another section's filters are left alone.
    expect(store.filters().bi.text).toBe('kept');
  });
});
