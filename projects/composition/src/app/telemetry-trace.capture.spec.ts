import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';
import * as fs from 'fs';
import * as path from 'path';
import { Subject, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  CPS_LOG_API_PROVIDER,
  CpsLoggerService,
  CpsScenarioTelemetryService,
  CpsTelemetrySink,
  provideCpsTelemetry,
  traceScenario,
  withLogging,
  withRedaction
} from 'cps-telemetry';
import { AppLogApiProvider } from './services/app-log-api.provider';
import { AppTelemetryService } from './services/app-telemetry.service';
import { TablePageComponent } from './pages/table-page/table-page.component';
import { FileUploadPageComponent } from './pages/file-upload-page/file-upload-page.component';
import { AutocompletePageComponent } from './pages/autocomplete-page/autocomplete-page.component';
import './services/telemetry.schema';

/**
 * Telemetry wire-audit capture harness — not a regression suite, though it
 * lives in a `.spec.ts` file and runs under the `composition` Jest project.
 *
 * Drives `composition`'s real wiring with `debugScenario`/`debugLogger`/
 * `debugBI` on, and records two things per case: the exact payload handed
 * to `CpsTelemetrySink`/`AppLogApiProvider`, and the exact console line the
 * library's debug flags print.
 *
 * Every `it()` appends to one shared `trace`/`consoleLines` pair; the final
 * test writes both to disk as JSON for `npm run trace:telemetry` to produce.
 *
 * `real: true` entries come from driving composition's actual pages.
 * `real: false` entries call the real library classes directly, for
 * statuses/fields composition's demo data doesn't reach on its own.
 */

interface TraceEntry {
  seq: number;
  group: string;
  case: string;
  real: boolean;
  source: 'AWS RUM' | 'LOG API';
  eventType: string;
  payload: unknown;
}

interface ConsoleLine {
  seq: number;
  channel: 'log' | 'warn' | 'error';
  text: string;
  payload: unknown;
}

const trace: TraceEntry[] = [];
const consoleLines: ConsoleLine[] = [];
let seq = 0;

function pushEntry(
  group: string,
  caseName: string,
  real: boolean,
  source: 'AWS RUM' | 'LOG API',
  eventType: string,
  payload: unknown
): void {
  trace.push({
    seq: ++seq,
    group,
    case: caseName,
    real,
    source,
    eventType,
    payload: clone(payload)
  });
}

/** Deep-clones via JSON round-trip so later mutation of a live object can't retroactively change an already-captured entry. */
function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

/** Captures what a `RecordingSink`-style double is handed. */
class CapturingSink extends CpsTelemetrySink {
  group = 'unlabeled';
  real = true;

  record(eventType: string, payload: object): void {
    pushEntry(
      this.group,
      this.currentCase,
      this.real,
      'AWS RUM',
      eventType,
      payload
    );
  }

  recordError(error: unknown): void {
    pushEntry(
      this.group,
      this.currentCase,
      this.real,
      'AWS RUM',
      'sink.recordError',
      error
    );
  }

  currentCase = '';

  getSessionId(): string | undefined {
    return 'audit-session';
  }

  setUserId(): void {}

  getUserId(): string | undefined {
    return undefined;
  }

  flush(): void {}
}

let restoreConsole: () => void;

beforeAll(() => {
  localStorage.setItem('debugScenario', 'true');
  localStorage.setItem('debugLogger', 'true');
  localStorage.setItem('debugBI', 'true');

  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };
  (['log', 'warn', 'error'] as const).forEach((channel) => {
    jest.spyOn(console, channel).mockImplementation((...args: unknown[]) => {
      consoleLines.push({
        seq: ++seq,
        channel,
        text: String(args[0]),
        payload: clone(args[1])
      });
    });
  });
  restoreConsole = () => {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  };
});

afterAll(() => {
  restoreConsole();
  localStorage.clear();
});

describe('Real: route-navigation', () => {
  let service: AppTelemetryService;
  let routerEvents: Subject<unknown>;
  let sink: CapturingSink;
  let logApi: AppLogApiProvider;
  let nextId = 1;

  beforeEach(async () => {
    jest.useFakeTimers();
    routerEvents = new Subject<unknown>();
    sink = new CapturingSink();
    sink.group = 'route-navigation';

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink },
        { provide: Router, useValue: { events: routerEvents.asObservable() } }
      ]
    }).compileComponents();

    service = TestBed.inject(AppTelemetryService);
    logApi = TestBed.inject(AppLogApiProvider);
    service.start();
  });

  afterEach(() => jest.useRealTimers());

  it('logs "Application started" at boot', () => {
    sink.currentCase = 'app start';
    const started = logApi
      .getRecords()
      .find((r) => r.message === 'Application started');
    pushEntry(
      'route-navigation',
      'app start log line',
      true,
      'LOG API',
      'log',
      started
    );
    expect(started).toBeDefined();
  });

  it('NavigationStart -> NavigationEnd settles as success', () => {
    sink.currentCase = 'success';
    const id = nextId++;
    routerEvents.next(new NavigationStart(id, '/table', undefined, undefined));
    jest.advanceTimersByTime(180);
    routerEvents.next(new NavigationEnd(id, '/table', '/table'));
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('NavigationStart -> NavigationCancel settles as abandoned', () => {
    sink.currentCase = 'abandoned (cancel)';
    const id = nextId++;
    routerEvents.next(new NavigationStart(id, '/file-upload'));
    jest.advanceTimersByTime(60);
    routerEvents.next(
      new NavigationCancel(id, '/file-upload', 'guard rejected')
    );
    const entry = trace.find(
      (e) => e.group === sink.group && e.case === sink.currentCase
    );
    expect(
      (entry?.payload as { metadata?: { abandonedBy?: string } })?.metadata
        ?.abandonedBy
    ).toBe('caller');
  });

  it('a second NavigationStart supersedes the first (abandoned)', () => {
    sink.currentCase = 'superseded';
    const first = nextId++;
    const second = nextId++;
    routerEvents.next(new NavigationStart(first, '/autocomplete'));
    jest.advanceTimersByTime(50);
    routerEvents.next(
      new NavigationCancel(first, '/autocomplete', 'superseded by navigation')
    );
    routerEvents.next(new NavigationStart(second, '/autocomplete'));
    jest.advanceTimersByTime(160);
    routerEvents.next(
      new NavigationEnd(second, '/autocomplete', '/autocomplete')
    );
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('NavigationStart -> NavigationError settles as failure, correlated to a log line', () => {
    sink.currentCase = 'failure';
    const id = nextId++;
    routerEvents.next(new NavigationStart(id, '/broken-chunk'));
    jest.advanceTimersByTime(220);
    routerEvents.next(
      new NavigationError(
        id,
        '/broken-chunk',
        'ChunkLoadError: Loading chunk 12 failed.'
      )
    );
    const failLog = logApi
      .getRecords()
      .find((r) => r.message === 'Navigation failed');
    pushEntry(
      'route-navigation',
      'failure -> correlated log line',
      true,
      'LOG API',
      'error',
      failLog
    );
    expect(failLog?.correlationId).toBeDefined();
  });

  it('never settling times out after 30s', () => {
    sink.currentCase = 'timeout';
    const id = nextId++;
    routerEvents.next(new NavigationStart(id, '/stuck-chunk'));
    jest.advanceTimersByTime(30_000);
    const entry = trace.find(
      (e) => e.group === sink.group && e.case === sink.currentCase
    );
    expect((entry?.payload as { status?: string })?.status).toBe('timeout');
  });
});

describe('Real: table-page-load', () => {
  let component: TablePageComponent;
  let sink: CapturingSink;

  function seedRows(n: number) {
    component.dataVirtual = Array.from({ length: n }, (_, i) => ({
      a: `a${i}`,
      b: `b${i % 5}`,
      c: i,
      d: new Date(),
      e: i % 2 === 0,
      f: new Date()
    }));
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    sink = new CapturingSink();
    sink.group = 'table-page-load';

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    }).compileComponents();

    component = TestBed.runInInjectionContext(() => new TablePageComponent());
    seedRows(20);
  });

  afterEach(() => jest.useRealTimers());

  it('lazy load settles as success, with the format-row aggregate', async () => {
    sink.currentCase = 'success + format-row aggregate';
    component.onLazyLoad({ first: 0, rows: 10 });
    await Promise.resolve();
    jest.advanceTimersByTime(600);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('a second lazy load supersedes the first (abandoned)', async () => {
    sink.currentCase = 'superseded';
    component.onLazyLoad({ first: 0, rows: 10 });
    await Promise.resolve();
    jest.advanceTimersByTime(250);
    component.onLazyLoad({ first: 10, rows: 10 });
    await Promise.resolve();
    jest.advanceTimersByTime(600);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('component destroyed mid-flight settles as abandoned', async () => {
    sink.currentCase = 'component-destroyed';
    component.onLazyLoad({ first: 0, rows: 10 });
    await Promise.resolve();
    jest.advanceTimersByTime(300);
    component.ngOnDestroy();
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });
});

describe('Real: file-upload', () => {
  let component: FileUploadPageComponent;
  let sink: CapturingSink;
  let logApi: AppLogApiProvider;

  function makeFile(name: string, rejects = false): File {
    return {
      name,
      text: () =>
        rejects
          ? Promise.reject(new Error('Read permission denied by the OS'))
          : Promise.resolve('contents')
    } as unknown as File;
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    sink = new CapturingSink();
    sink.group = 'file-upload';

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    }).compileComponents();

    component = TestBed.runInInjectionContext(
      () => new FileUploadPageComponent()
    );
    logApi = TestBed.inject(AppLogApiProvider);
  });

  afterEach(() => jest.useRealTimers());

  it('processExtraInfoUploadedFile settles as success', async () => {
    sink.currentCase = 'success';
    component.processExtraInfoUploadedFile(makeFile('schema.json')).subscribe();
    await Promise.resolve();
    jest.advanceTimersByTime(3000);
    await Promise.resolve();
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('processFailingUploadedFile settles as failure with no error object', async () => {
    sink.currentCase = 'failure (no error argument)';
    component.processFailingUploadedFile().subscribe();
    jest.advanceTimersByTime(500);
    const entry = trace.find(
      (e) => e.group === sink.group && e.case === sink.currentCase
    );
    expect(entry).toBeDefined();
    expect(
      (entry?.payload as { status?: string; error?: unknown })?.status
    ).toBe('failure');
    expect(
      (entry?.payload as { status?: string; error?: unknown })?.error
    ).toBeUndefined();
  });

  it('onExtraInfoFileProcessingCancelled settles as abandoned', async () => {
    sink.currentCase = 'abandoned (user-cancelled)';
    component.processExtraInfoUploadedFile(makeFile('big.csv')).subscribe();
    await Promise.resolve();
    jest.advanceTimersByTime(1200);
    component.onExtraInfoFileProcessingCancelled('big.csv');
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('ngOnDestroy mid-flight settles as abandoned', async () => {
    sink.currentCase = 'abandoned (component-destroyed)';
    component
      .processExtraInfoUploadedFile(makeFile('mid-flight.csv'))
      .subscribe();
    await Promise.resolve();
    jest.advanceTimersByTime(800);
    component.ngOnDestroy();
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('a rejecting file read logs "Error reading file"', async () => {
    sink.currentCase = 'error reading file -> log line';
    component
      .processExtraInfoUploadedFile(makeFile('corrupt.csv', true))
      .subscribe({ error: () => undefined });
    await Promise.resolve();
    await Promise.resolve();
    const errLog = logApi
      .getRecords()
      .find((r) => r.message === 'Error reading file');
    pushEntry(
      'file-upload',
      'error reading file -> log line',
      true,
      'LOG API',
      'error',
      errLog
    );
    expect(errLog).toBeDefined();
  });
});

describe('Real: autocomplete', () => {
  let component: AutocompletePageComponent;
  let sink: CapturingSink;

  beforeEach(async () => {
    jest.useFakeTimers();
    sink = new CapturingSink();
    sink.group = 'autocomplete';

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink },
        FormBuilder
      ]
    }).compileComponents();

    component = TestBed.runInInjectionContext(
      () => new AutocompletePageComponent(TestBed.inject(FormBuilder))
    );
    component.ngOnInit();
    component.singleOptionsObservable$?.subscribe();
    component.multiOptionsObservable$?.subscribe();
  });

  afterEach(() => jest.useRealTimers());

  it('a search settles as success', () => {
    sink.currentCase = 'search success';
    component.onSingleInputChanged('lon');
    jest.advanceTimersByTime(1000);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('a search settles as failure (backend stubbed down, same pattern the existing spec uses)', () => {
    sink.currentCase = 'search failure';
    jest
      .spyOn(
        component as unknown as {
          _getOptionsFromServer: () => ReturnType<typeof throwError>;
        },
        '_getOptionsFromServer'
      )
      // `delay()` doesn't delay an error — use `timer` + `switchMap` instead.
      .mockReturnValue(
        timer(1000).pipe(
          switchMap(() => throwError(() => new Error('backend down')))
        )
      );
    component.onSingleInputChanged('lon');
    jest.advanceTimersByTime(1000);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('a second keystroke supersedes the first search (abandoned)', () => {
    sink.currentCase = 'search superseded';
    component.onSingleInputChanged('lon');
    jest.advanceTimersByTime(220);
    component.onSingleInputChanged('par');
    jest.advanceTimersByTime(1000);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('selecting an option settles validation as success', () => {
    sink.currentCase = 'validate success';
    component.onOptionSelected(component.options[0]);
    jest.advanceTimersByTime(3000);
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('destroying the component mid-flight settles every open scenario as abandoned', () => {
    sink.currentCase = 'destroyed mid-flight';
    component.onSingleInputChanged('lon');
    component.onMultiInputChanged('lon');
    component.onOptionSelected(component.options[1]);
    jest.advanceTimersByTime(400);
    component.ngOnDestroy();
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });
});

describe('Real: BI events', () => {
  let service: AppTelemetryService;
  let sink: CapturingSink;

  beforeEach(async () => {
    sink = new CapturingSink();
    sink.group = 'BI events';

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink },
        { provide: Router, useValue: { events: new Subject().asObservable() } }
      ]
    }).compileComponents();

    service = TestBed.inject(AppTelemetryService);
  });

  it('trackThemeChanged records theme_changed', () => {
    sink.currentCase = 'theme_changed';
    service.trackThemeChanged('dark');
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('trackClick records sidebar_toggled', () => {
    sink.currentCase = 'sidebar_toggled';
    service.trackClick('sidebar_toggled', { expanded: true });
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('trackClick records theme_option_changed', () => {
    sink.currentCase = 'theme_option_changed';
    service.trackClick('theme_option_changed', {
      dimension: 'color',
      value: 'blue'
    });
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('an identical click within the dedup window is suppressed', () => {
    sink.currentCase = 'code_copied (twice, back to back — second suppressed)';
    const countBefore = trace.filter((e) => e.group === 'BI events').length;
    service.trackClick('code_copied', { componentName: 'cps-table' });
    service.trackClick('code_copied', { componentName: 'cps-table' });
    const countAfter = trace.filter((e) => e.group === 'BI events').length;
    pushEntry(
      'BI events',
      'duplicate call within 400ms dedup window — second call suppressed',
      true,
      'AWS RUM',
      'observation',
      { firstCallRecorded: countAfter - countBefore === 1 }
    );
    expect(countAfter - countBefore).toBe(1);
  });

  it('the same click after the dedup window elapses is recorded again', () => {
    sink.currentCase = 'code_copied (twice, 401ms apart — both recorded)';
    jest.useFakeTimers();
    const countBefore = trace.filter((e) => e.group === sink.group).length;
    service.trackClick('code_copied', { componentName: 'cps-select' });
    jest.advanceTimersByTime(401);
    service.trackClick('code_copied', { componentName: 'cps-select' });
    const countAfter = trace.filter((e) => e.group === sink.group).length;
    jest.useRealTimers();
    expect(countAfter - countBefore).toBe(2);
  });
});

describe('Synthetic: statuses and fields composition never triggers', () => {
  let sink: CapturingSink;
  let scenarioTelemetry: CpsScenarioTelemetryService;

  beforeEach(async () => {
    sink = new CapturingSink();
    sink.group = 'synthetic';
    sink.real = false;

    await TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition',
          environment: 'production',
          version: '1.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    }).compileComponents();

    scenarioTelemetry = TestBed.inject(CpsScenarioTelemetryService);
  });

  it('`incomplete` — no composition page ever calls .incomplete()', () => {
    sink.currentCase = 'incomplete status (no real trigger exists)';
    const scenario = scenarioTelemetry.start({
      name: 'table-page-load',
      feature: 'table'
    });
    scenario.incomplete({ reason: 'no-results' });
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });

  it('`exceededStepsLimit` — no composition scenario ever opens 50+ steps', () => {
    sink.currentCase = 'exceededStepsLimit (no real trigger reaches maxSteps)';
    const scenario = scenarioTelemetry.start({
      name: 'table-page-load',
      feature: 'table'
    });
    for (let i = 0; i < 55; i++) {
      scenario.step('fetch');
    }
    scenario.complete();
    const entry = trace.find(
      (e) => e.group === sink.group && e.case === sink.currentCase
    );
    expect(
      (entry?.payload as { exceededStepsLimit?: boolean })?.exceededStepsLimit
    ).toBe(true);
  });

  it('autocomplete-validate failure — onOptionSelected has no stubbable network seam', () => {
    sink.currentCase =
      'autocomplete-validate failure (no stubbable seam on the component)';
    const scenario = scenarioTelemetry.start({
      name: 'autocomplete-validate',
      feature: 'autocomplete'
    });
    scenario.step('validate');
    throwError(() => new Error('Selected option failed remote validation'))
      .pipe(traceScenario(scenario))
      .subscribe({ error: () => undefined });
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });
});

describe('Synthetic: mirrorErrorsToRum (composition leaves this off)', () => {
  it('an error-level log is also mirrored to AWS RUM when the config is turned on', () => {
    const sink = new CapturingSink();
    sink.group = 'synthetic';
    sink.real = false;
    sink.currentCase = 'mirrorErrorsToRum: true (composition never sets this)';

    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          {
            application: 'composition',
            environment: 'production',
            version: '1.0.0'
          },
          withLogging({ mirrorErrorsToRum: true })
        ),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    });

    const logger = TestBed.inject(CpsLoggerService).getLogger('app');
    logger.error('Simulated unexpected failure', {
      error: new Error('Simulated unexpected failure')
    });
    expect(
      trace.some((e) => e.group === sink.group && e.case === sink.currentCase)
    ).toBe(true);
  });
});

describe('Synthetic: redaction (composition never logs PII-shaped data)', () => {
  it('the key denylist and value-pattern scan both redact, when scanValuePatterns is turned on', () => {
    const sink = new CapturingSink();
    sink.group = 'synthetic';
    sink.real = false;
    sink.currentCase =
      'redaction of a contact-form-shaped payload (composition never logs anything PII-shaped)';

    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          {
            application: 'composition',
            environment: 'production',
            version: '1.0.0'
          },
          withRedaction({ scanValuePatterns: ['email', 'creditCard'] })
        ),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    });

    const logApi = TestBed.inject(AppLogApiProvider);
    const logger = TestBed.inject(CpsLoggerService).getLogger('app');
    logger.log('User submitted contact form', {
      metadata: {
        email: 'jane.doe@example.com',
        password: 'hunter2',
        notes: 'Card ending in 4111 1111 1111 1111, please call back.'
      }
    });
    const record = logApi
      .getRecords()
      .find((r) => r.message === 'User submitted contact form');
    pushEntry(
      'synthetic',
      'redaction with scanValuePatterns on',
      false,
      'LOG API',
      'log',
      record
    );
    expect(record?.metadata?.password).toBe('[redacted]');
  });
});

describe('Synthetic: minLevel filtering (composition leaves minLevel at the default "log")', () => {
  it('a log-level call is dropped once minLevel is raised to "warn"', () => {
    const sink = new CapturingSink();
    sink.group = 'synthetic';
    sink.real = false;
    sink.currentCase =
      'minLevel: "warn" (composition never overrides minLevel)';

    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry(
          {
            application: 'composition',
            environment: 'production',
            version: '1.0.0'
          },
          withLogging({ minLevel: 'warn' })
        ),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useValue: sink }
      ]
    });

    const logApi = TestBed.inject(AppLogApiProvider);
    const logger = TestBed.inject(CpsLoggerService).getLogger('app');
    logger.log('This should be dropped by minLevel');
    logger.warn('This should still go through');

    const records = logApi.getRecords();
    pushEntry(
      'synthetic',
      'minLevel: "warn" filtering observation',
      false,
      'LOG API',
      'observation',
      {
        droppedCallRecorded: records.some(
          (r) => r.message === 'This should be dropped by minLevel'
        ),
        warnCallRecorded: records.some(
          (r) => r.message === 'This should still go through'
        )
      }
    );
    expect(
      records.some((r) => r.message === 'This should be dropped by minLevel')
    ).toBe(false);
    expect(
      records.some((r) => r.message === 'This should still go through')
    ).toBe(true);
  });
});

describe('Write trace', () => {
  it('writes the captured trace + console transcript to disk', () => {
    const outDir = path.join(__dirname, '..', '..', 'telemetry-trace');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'trace.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          entries: trace,
          consoleLines
        },
        undefined,
        2
      )
    );
    expect(trace.length).toBeGreaterThan(0);
    expect(consoleLines.length).toBeGreaterThan(0);
  });
});
