# cps-telemetry

Telemetry for Angular apps, in three parts:

- **Scenarios** — did a user journey succeed, and how long did it take?
- **BI events** — which features are used?
- **Logs** — what exactly happened?

Events go to AWS CloudWatch RUM. Logs go to a backend you provide.

## Install

```bash
npm install cps-telemetry
npm install aws-rum-web   # only for the AWS RUM sink
```

## Setup

```ts
import { CPS_LOG_API_PROVIDER, provideCpsTelemetry } from 'cps-telemetry';
import {
  CPS_RUM_CREDENTIALS_PROVIDER,
  provideCpsTelemetryRumSink
} from 'cps-telemetry/rum';

providers: [
  provideCpsTelemetry({
    application: 'my-app',
    environment: 'production',
    version: '1.0.0'
  }),

  // Where events go
  provideCpsTelemetryRumSink(),
  { provide: CPS_RUM_CREDENTIALS_PROVIDER, useExisting: MyRumCredentials },

  // Where logs go
  { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend }
];
```

There are no default destinations — you always choose them, so an app can't
look wired up while shipping nothing. For local development, ship nowhere:

```ts
providers: [
  provideCpsTelemetry({ application: 'my-app', environment: 'dev', version }),
  provideCpsTelemetrySink('noop'),
  { provide: CPS_LOG_API_PROVIDER, useClass: CpsNoopLogApiProvider }
];
```

Optional settings are added with `withScenarios()`, `withLogging()`,
`withBIEvents()` and `withRedaction()`:

```ts
provideCpsTelemetry(
  { application: 'my-app', environment: 'production', version: '1.0.0' },
  withLogging({ minLevel: 'warn' }),
  withScenarios({ defaultTimeoutMs: 60_000 })
);
```

### AWS credentials

Fetch them from your backend:

```ts
@Injectable({ providedIn: 'root' })
export class MyRumCredentials implements CpsRumCredentialsProvider {
  async load(): Promise<CpsRumBootstrap | null> {
    const res = await fetch('/rum/init', { cache: 'no-store' });
    if (!res.ok) return null;

    const { enabled, config, credentials } = await res.json();
    return enabled ? { config, credentials } : null; // null = don't ship
  }
}
```

### Log backend

```ts
@Injectable({ providedIn: 'root' })
export class MyLogBackend implements CpsLogApiProvider {
  send(record: CpsLogRecord): void {
    void fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(record),
      keepalive: true
    }).catch(() => undefined);
  }

  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    const params = new URLSearchParams(filter as Record<string, string>);
    return fetch(`/api/logs?${params}`).then((r) => r.json());
  }
}
```

Batching, retries and authentication are up to your backend class. If it
batches, add a `flush()` method — the library calls it when the page is
hidden or closed.

### Using a different destination

RUM is one destination; a realm always has exactly one. To send somewhere
else, swap it — application code doesn't change:

```ts
providers: [
  provideCpsTelemetry({ application: 'my-app', environment, version }),

  // Where events go — replaces provideCpsTelemetryRumSink() and
  // CPS_RUM_CREDENTIALS_PROVIDER
  provideCpsTelemetryDestination(MyBackendSink),

  // Where logs go — unchanged
  { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend }
];
```

`MyBackendSink` extends `CpsTelemetrySink`; in its `record()`,
`cpsClassifyTelemetryEvent(eventType, payload)` tells a scenario from a BI
event. Providing two destinations fails at startup.

## Declare your names

Scenario, step, event and logger names are typed, so a typo is a compile
error instead of a broken dashboard. Declare them once:

```ts
// src/app/telemetry.schema.ts
declare module 'cps-telemetry' {
  interface CpsScenarioNames {
    'load-customers': true;
  }
  interface CpsScenarioSteps {
    fetch: true;
    render: true;
  }
  interface CpsBIEventNames {
    export_clicked: true;
  }
  interface CpsLoggerNames {
    checkout: true;
  }
}

export {};
```

Until you declare any, plain strings are accepted.

## Scenarios

A scenario measures one user journey.

```ts
class CustomersComponent {
  private readonly scenarios = inject(CpsScenarioTelemetryService);

  async load() {
    const scenario = this.scenarios.start({ name: 'load-customers' });

    try {
      scenario.step('fetch');
      const rows = await this.api.fetchCustomers();

      scenario.step('render');
      this.rows.set(rows);

      scenario.complete();
    } catch (error) {
      scenario.fail({ error });
    }
  }
}
```

End every scenario with one of these:

| Method         | Use when                                            |
| -------------- | --------------------------------------------------- |
| `complete()`   | It worked                                           |
| `fail()`       | Something broke                                     |
| `incomplete()` | An expected dead end, e.g. a search with no results |
| `cancel()`     | It no longer matters, e.g. the user moved on        |

A scenario that is never ended times out after 30 seconds, and one still
running when the page closes is recorded as abandoned. Calling an end method
twice is harmless — the first one wins.

For RxJS, `traceScenario` ends the scenario for you:

```ts
this.api.fetchCustomers().pipe(traceScenario(scenario)).subscribe();
```

## BI events

```ts
class ExportButton {
  private readonly bi = inject(CpsBITelemetryService);

  onClick() {
    this.bi.track('export_clicked', { format: 'csv' });
  }
}
```

## Logging

```ts
class CheckoutService {
  private readonly logger = inject(CpsLoggerService).getLogger('checkout');

  async submit(scenario: CpsScenario) {
    this.logger.log('Submitting order');

    try {
      await this.api.pay();
    } catch (error) {
      // correlationId ties this line to the scenario's journey
      this.logger.error('Payment failed', {
        error,
        correlationId: scenario.id
      });
    }
  }
}
```

Read log lines back through your backend, for example everything written
during one journey:

```ts
class SupportService {
  private readonly logs = inject(CpsLoggerService);

  linesOf(scenario: CpsScenario) {
    return this.logs.query({ correlationId: scenario.id });
  }
}
```

## Signed-in user

```ts
const sink = inject(CpsTelemetrySink);

sink.setUserId(user.id); // on sign-in — an opaque id, never an email
sink.setUserId(undefined); // on sign-out
```

## Privacy

Metadata accepts only flat values (strings, numbers, booleans, `null`), so objects
full of personal data can't slip in. On top of that, the library redacts
values under keys like `password` or `token`, strips URL query strings, and
caps sizes. To also catch emails, card numbers and similar by their shape:

```ts
withRedaction({ scanValuePatterns: ['email', 'creditCard'] });
```

Send opaque user ids, and keep personal data out of your URLs.

## Micro-frontends

In a page composed of fragments, the shell sends everything and the
fragments forward to it — so a user is one session, not one per fragment.

```ts
// shell
providers: [
  provideCpsTelemetry({ application: 'shell', environment, version }),
  provideCpsTelemetryRumSink(),
  { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend },
  provideCpsTelemetryBroadcastHost()
];

// each fragment
providers: [
  provideCpsTelemetry({ application: 'cart', environment, version }),
  provideCpsTelemetrySink('broadcast')
];
```

Fragment code doesn't change. Give each fragment its own `application` name.

## Seeing what is sent

**In the console** — run in DevTools, no reload needed:

```js
localStorage.setItem('debugScenario', 'true');
localStorage.setItem('debugBI', 'true');
localStorage.setItem('debugLogger', 'true'); // or 'checkout,cart' for some loggers
```

**In the app** — add the diagnostics popup (needs `cps-ui-kit`):

```ts
import { provideCpsTelemetryDiagnostics } from 'cps-telemetry/diagnostics';

providers: [provideCpsTelemetryDiagnostics()];
```

Open it with **⇧⌥⌘8** on macOS or **Ctrl+Alt+Shift+8** on Windows and Linux.
It lists everything the app sends from that moment on, with search, filters
and JSON download.

## Testing

```ts
TestBed.configureTestingModule({
  providers: [
    provideCpsTelemetry({
      application: 'test',
      environment: 'test',
      version: '0'
    }),
    provideCpsTelemetrySink('noop'),
    { provide: CPS_LOG_API_PROVIDER, useClass: CpsNoopLogApiProvider }
  ]
});
```

## Good to know

- Telemetry never breaks your app: library errors are caught, and reported
  to the console only in dev mode.
- It is safe under server-side rendering.
- A scenario sends one event when it ends, not one per step — AWS RUM allows
  200 events per session by default.
