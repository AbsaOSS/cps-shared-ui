# cps-telemetry

A small, reusable Angular telemetry library. It covers three things:
**application logs**, **scenario health telemetry**, and **business/UX
events**, with an optional AWS CloudWatch RUM sink.

Nothing in this library is tied to one specific application. The host app
supplies its own event names, configuration, and AWS credentials.

See [DESIGN.md](./DESIGN.md) for the architecture, the AWS capability checks,
and the reasoning behind each decision.

## Install

```bash
npm install cps-telemetry
# optional, only if you use the AWS RUM sink
npm install aws-rum-web
```

## Setup

```ts
import {
  CPS_LOG_API_PROVIDER,
  CPS_RUM_CREDENTIALS_PROVIDER,
  provideCpsTelemetry,
  provideCpsTelemetrySink,
  withLogging,
  withScenarios
} from 'cps-telemetry';

providers: [
  provideCpsTelemetry(
    // Identity: required, shared by every concern below.
    {
      application: 'my-app',
      environment: 'production',
      version: '1.0.0',

      // Optional. Prefixes the emitted event types — `com.cps.scenario`,
      // `com.cps.scenario.step`, `com.cps.bi` by default. Set your own
      // namespace when migrating an app whose CloudWatch metrics, queries or
      // dashboards already key on one.
      eventNamespace: 'com.my-app'
    },

    // Every concern below is optional — skip a with*() call to take the
    // library default for it, the same way Angular's own
    // provideHttpClient(withInterceptors(...)) composes optional behavior.
    withLogging({ minLevel: 'warn' }),
    withScenarios({ maxSteps: 10 })
    // withBiEvents({ ... }), withRedaction({ ... }) are also available.
  ),

  // Required. Both are chosen explicitly. There is no default destination,
  // so an app can never look wired up while actually shipping nothing.
  provideCpsTelemetrySink('rum'), // 'rum' | 'broadcast' | 'noop'
  { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend },

  // Optional.
  {
    provide: CPS_RUM_CREDENTIALS_PROVIDER,
    useExisting: AppRumCredentialsProvider
  }
];
```

Each concern is independently optional. An app that only configures logging
never has to think about scenarios, BI events, or redaction. If you want to
override one concern directly through Angular's DI — in a test, or with a
value computed at runtime — each has its own token: `CPS_LOG_CONFIG`,
`CPS_SCENARIO_CONFIG`, `CPS_BI_CONFIG`, `CPS_REDACT_CONFIG`. You target that
token directly, with no need to rebuild the whole identity object. See
[DESIGN.md](./DESIGN.md) for why identity is required and shared while every
other concern gets its own token.

`provideCpsTelemetry()` only registers configuration. If you inject
`CpsScenarioTelemetryService` or `CpsBiTelemetryService` without configuring a
sink, it fails at bootstrap with `NG0201` — the same way a missing
`provideRouter()` does. A log API provider is likewise required to inject
`CpsLoggerService` at all. For local development, or a deployment that ships
nothing, say so explicitly:

```ts
providers: [
  provideCpsTelemetrySink('noop'),
  { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend }
];
```

`CpsLoggerService` is the one exception to the sink rule above. Its actual
destination is the log API provider, and a sink is only there to enrich it —
`sessionId`/`userId` correlation (see [Who is signed in](#who-is-signed-in))
and the optional `mirrorErrorsToRum` mirroring (see [Logging](#logging)). If
you only want structured logging — no scenarios, no BI events, no RUM at all
— you can leave out `provideCpsTelemetrySink(...)` entirely. The logger still
works, just without that identity correlation, and `mirrorErrorsToRum`
silently does nothing instead of failing at bootstrap.

Supply AWS details by implementing `CpsRumCredentialsProvider`:

```ts
@Injectable({ providedIn: 'root' })
export class AppRumCredentialsProvider implements CpsRumCredentialsProvider {
  async load(): Promise<CpsRumBootstrap | null> {
    // no-store: this response carries live, temporary AWS credentials.
    const res = await fetch('/rum/init', { cache: 'no-store' });
    if (!res.ok) return null;

    const { enabled, config, credentials } = await res.json();
    return enabled ? { config, credentials } : null;
  }
}
```

Returning `null` turns off shipping without disabling the library — including
from a later refresh, not just the initial load, so a provider can revoke
telemetry mid-session and the already-running client is torn down rather
than left collecting with stale credentials. Returning a bootstrap with
`credentials` omitted is a different, valid state: an app monitor configured
for unauthenticated access, not a disable signal.

### Advanced RUM configuration

Almost every `aws-rum-web` option is available on `config`, each with a
sensible default if you leave it out — see `CpsRumAppMonitorConfig`'s own
JSDoc for the full, grouped list. A representative sample:

```ts
async load(): Promise<CpsRumBootstrap | null> {
  const res = await fetch('/rum/init');
  if (!res.ok) return null;
  const { enabled, config, credentials } = await res.json();
  if (!enabled) return null;

  return {
    config: {
      ...config,
      sessionEventLimit: 400, // raise the session's 200-event budget
      cookieAttributes: { sameSite: 'Lax' },
      pagesToExclude: [/^\/admin/],
      disableAutoPageView: true,
      headers: { 'x-app-build': config.buildId }
    },
    credentials
  };
}
```

## Scenarios

A scenario is one user journey — load customer data, open a report, submit a
search. Any number can run at once, and each is fully independent.

### Declaring the vocabulary

Scenario and step names are **metric dimensions**, not free text, so they are
a finite type. Declare your application's names once in a schema file:

```ts
// src/app/telemetry.schema.ts
declare module 'cps-telemetry' {
  interface CpsScenarioNames {
    'load-customer-data': true;
  }

  interface CpsScenarioSteps {
    'fetch-data': true;
    render: true;
  }
}

export {};
```

Import that file once — anywhere in the compilation — and every name gets
checked from then on:

```ts
scenario.step('fetch-data'); // ok
scenario.step('fetch-dat'); // error TS2345
```

A typo here would not just produce a wrong number. It would silently start a
**second, incomplete** metric series, and the dashboard meant to catch the
regression would keep reading healthy. Interpolating an id —
``step(`load-${customerId}`)`` — causes the same problem at a larger scale.
The type turns both from a data problem you find a month later into a compile
error you find right away.

Both registries start empty, and `CpsScenarioName` / `CpsStepName` fall back
to `string` until the first augmentation — so adopting this is optional, and
you can do it one name at a time. `CpsScenarioSteps` also covers
`aggregateStart` / `aggregateEnd`, since they name a phase of work, just like
a step does.

### Recording a journey

```ts
const scenario = this.scenarioTelemetry.start({
  name: 'load-customer-data',
  feature: 'customers'
});

try {
  scenario.step('fetch-data');
  const rows = await this.api.fetchCustomers();

  scenario.step('render'); // closes 'fetch-data' automatically
  this.rows.set(rows);

  scenario.complete({ metadata: { rowCount: rows.length } });
} catch (error) {
  scenario.fail({ error });
}
```

`complete`/`fail`/`incomplete`/`cancel` all take the same shape,
`(outcome?: CpsScenarioOutcome)`, so there is exactly one thing to remember no
matter which one you call:

| Method                                        | Effect                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `step(name, metadata?)`                       | Opens a step, closing the previous one as completed                             |
| `endStep(detail?)`                            | Closes the open step early, when the work finishes well before the next step    |
| `failStep(error, detail?)`                    | Closes the open step as failed; the scenario keeps running                      |
| `setData(metadata)`                           | Merges attributes into the scenario while it is still running                   |
| `aggregateStart(name)` / `aggregateEnd(name)` | Sums repeated calls of one operation                                            |
| `complete(outcome?)`                          | Settles as `success`                                                            |
| `fail(outcome?)`                              | Settles as `failure` — pass the thrown value as `outcome.error`                 |
| `cancel(outcome?)`                            | Settles as `abandoned`, caused by the caller (`metadata.abandonedBy: 'caller'`) |
| `incomplete(outcome?)`                        | Settles as `incomplete`                                                         |
| `settle(status, outcome?, error?)`            | Settles into a status you already have as data — **for adapters**, see below    |
| `toRecord()`                                  | Snapshots the current `CpsScenarioRecord`; safe to call mid-flight              |

`CpsScenarioOutcome` carries `statusCode`, `message`, `reason`, `metadata`,
and `error`. `message` and `reason` are separate fields on purpose: `message`
is a free-text note, `reason` is a short structured value you can group by
(`incomplete({ reason: 'no-results' })`). `statusCode` and `error` are kept
apart the same way. All of them end up on the record.

### RxJS streams and `traceScenario`

For Observable-driven journeys (an `HttpClient` request, for example), use the
pipeable `traceScenario` operator. It completes or fails the scenario
automatically based on how the stream ends:

```ts
import { traceScenario } from 'cps-telemetry';

this.api
  .fetchCustomers()
  .pipe(
    traceScenario(scenario, (rows) => ({
      metadata: { rowCount: rows.length }
    }))
  )
  .subscribe();
```

There are five statuses: `success`, `failure`, `abandoned`, `incomplete` and
`timeout` — there is no "in progress" value. `scenario.status` stays
`undefined` until it settles; use `scenario.isSettled` to check whether it is
done. Once settled, a scenario stays settled: calling a settle method again is
a no-op, never a throw. A scenario that never settles on its own auto-settles
as `timeout` once its deadline passes (30s by default); one still running when
the page unloads auto-settles as `abandoned`. That way journeys the user
walked away from, or that never finished, show up in the data instead of just
vanishing.

### Choosing an outcome

`failure` means something broke — a defect. `abandoned` means the journey
stopped mattering: the user navigated away, or the page unloaded.
`metadata.abandonedBy` records which one — `'caller'` or `'page-hidden'`.
`timeout` means the deadline passed before the journey settled; it is its own
status rather than a cause folded into `abandoned`, so you can filter or
alert on it directly. `incomplete` is an expected path that did not reach the
goal — no search results, a guard declined, a flag routed the journey
somewhere else.

Keeping these apart is what makes the failure rate usable for alerting.

```ts
const rows = await this.api.search(term);
if (!rows.length) {
  scenario.incomplete({ reason: 'no-results' }); // not a failure
  return;
}
```

### Settling from a status you were handed

In application code, call `complete()` / `fail()` / `cancel()` /
`incomplete()` directly. Naming the outcome at the call site is what lets
someone find every place a journey can fail just by searching for `.fail(`.

`settle()` exists for adapters — places where the outcome genuinely arrives
as data:

```ts
const outcomeFor: Record<JobState, CpsScenarioStatus> = {
  ok: 'success',
  error: 'failure',
  superseded: 'abandoned'
};

jobUpdates.subscribe((update) =>
  this.scenarios.get(update.id)?.settle(outcomeFor[update.state])
);
```

Examples include a bridge settling a scenario from a message, a replay of
recorded telemetry, or a mapping from an HTTP or job status. If you find yourself
reaching for `settle()` inside a feature, the outcome was probably known all
along — use the named method instead.

### Measuring what the user waited for

`complete()` stops the clock the moment the JavaScript finishes. For a
journey that ends in a render, the user is often still looking at the old
screen at that exact moment.

The library does not settle scenarios on paint for you. Waiting is a decision
for the caller to make — there is no single right answer for how long to wait,
or what to do if nothing ever paints.

For a rough measure, two animation frames is a one-liner and needs nothing
from this library:

```ts
scenario.step('render');
this.rows.set(rows);
requestAnimationFrame(() => requestAnimationFrame(() => scenario.complete()));
```

That only proves a frame boundary passed — not that the pixels you actually
care about were drawn. To measure the real paint, mark the element with an
`elementtiming` attribute and observe `element` entries with a
`PerformanceObserver`. Two things to know before you do: pass
`buffered: true`, since the paint usually happens before the observer starts
watching, and check `PerformanceObserver.supportedEntryTypes` first — Element
Timing only works in Chromium, so most sessions will still need one of the
fallbacks above.

If nothing ever paints — a backgrounded tab, a render that stalled — none of
this settles the scenario, and its own `defaultTimeoutMs` settles it as
`timeout`. That is the honest outcome: the user never saw the result, so the
journey did not reach its goal.

### Repeated work

```ts
for (const row of rows) {
  scenario.aggregateStart('format-row');
  format(row);
  scenario.aggregateEnd('format-row');
}
// -> aggregates: [{ name: 'format-row', elapsed: 84, callCount: 500 }]
```

### Backdating

A journey usually starts before the code measuring it runs. Record the real
starting point and pass it as `startedAt`:

```ts
onClick() { this.clickedAt = Date.now(); }

// later, in the async handler
scenarioTelemetry.start({ name: 'export', startedAt: this.clickedAt });
```

### Reacting to outcomes

```ts
scenarioTelemetry.settled$
  .pipe(filter((r) => r.status === 'failure'))
  .subscribe((r) => this.notifications.warn(`${r.scenarioName} failed`));
```

Each emission is an independent copy, not the record shipped to the sink —
mutating it in a subscriber can never change what was already (or is about
to be) sent.

### Seeing scenarios in DevTools

Set `scenario.userTimings: true` — or just turn on the `debugScenario` flag —
and every scenario and step is mirrored to `performance.mark`/`measure`. That
puts the journey on the **Performance → Timings** track, right next to paint,
layout and network. That is where you find out _why_ a step was slow, which
the aggregate numbers in CloudWatch cannot tell you.

Entries are named `<application>:<scenario>:<boundary>:<scenarioId>`, using
the `application` name you configured as the prefix. Filtering the Timings
track by your app's own name shows just your journeys, and on a composed page
it keeps one fragment's entries apart from another's.

## BI events

```ts
biTelemetry.track('export_clicked', {
  exportType: 'csv',
  source: 'customer-table'
});

// optionally correlated to a journey
biTelemetry.track(
  'export_clicked',
  { exportType: 'csv' },
  {
    scenarioId: scenario.id
  }
);
```

Identical events within 400ms are collapsed into one — "identical" meaning
the same name, scenario correlation, event type, feature, and metadata
content; differing in any one of those is a distinct event.

All BI events share a single event type, with `eventName` carried as a field
— one schema to query, one extended-metric definition. If an existing
dashboard is keyed on a specific legacy type, a single event can override it:

```ts
biTelemetry.track(
  'click',
  { source: 'toolbar' },
  {
    eventType: 'com.data-gateway.click'
  }
);
```

Use that only for migration — not to give every event its own type.

## Logging

```ts
logger.log('Cache warmed');
logger.warn('Falling back to defaults', { context: 'ConfigService' });
logger.error('Failed to load customer data', {
  error,
  correlationId: scenario.id
});
```

Alternatively, hand the scenario a logger and let it bind the id for you:

```ts
const scenario = telemetry.start({
  name: 'load-customer-data',
  logger: this.logger
});

scenario.logger?.error('Failed to load customer data');
// -> correlationId === scenario.id, and the logger keeps its own name
```

`logger` is optional and supplied rather than injected. Scenarios and logging
stay independent this way: an application can use either one without
configuring the other, and a scenario never logs anything on its own.

`withLogging({ mirrorErrorsToRum: true })` also reports every
`logger.error(...)` call to the RUM sink as an error. This is off by
default, since the RUM client's error plugin already captures _unhandled_
errors, and this would add _handled_ ones on top, competing for the same
session event budget. It mirrors `error` when the call supplies one; a
message-only call (`logger.error('Something went wrong')`, no `error`) has
nothing to normalize, so a synthetic `Error` gets built from the message text
instead.

Logs go to a backend **you** provide, not to AWS RUM — see DESIGN.md §6.
Where records are kept, how they are authorized, and how long they live are
your decisions, so the library asks for a backend instead of assuming one:

```ts
@Injectable({ providedIn: 'root' })
export class MyLogBackend implements CpsLogApiProvider {
  send(record: CpsLogRecord): void {
    // Fire and forget: logging must never break the application.
    void fetch('/api/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record),
      keepalive: true // survives page unload
    }).catch(() => undefined);
  }

  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    const params = new URLSearchParams(filter as Record<string, string>);
    return fetch(`/api/logs?${params}`).then((r) => r.json());
  }
}
```

```ts
providers: [{ provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend }];
```

One binding, and that is the whole of it. `provideCpsTelemetry` wires up
everything that calls it — that part is not something you choose.

There is no default provider, though. A default destination would let an
application ship nothing while still looking fully wired up, and you'd only
notice once you went looking for a line that should have been there. So
forgetting this binding fails on first use instead of failing silently.

**Delivery is entirely your provider's policy.** The library does no
batching of its own — `send` is called once per record, right when it is
written. Retries, batching, backoff and authentication all live in your
implementation, where you know what your endpoint expects.

If your endpoint is cheap to call once per line, the example above is the
whole story. If a busy session would mean too many requests, batch inside
your own provider — collect into your own queue and flush it on your own
terms:

```ts
@Injectable({ providedIn: 'root' })
export class MyLogBackend implements CpsLogApiProvider {
  private buffer: CpsLogRecord[] = [];

  send(record: CpsLogRecord): void {
    this.buffer.push(record);
    if (this.buffer.length >= 25) {
      this.deliver();
    }
  }

  /** Called on `pagehide`, on visibilitychange going hidden, and on teardown. Must be synchronous. */
  flush(): void {
    this.deliver();
  }

  private deliver(): void {
    if (!this.buffer.length) {
      return;
    }
    const records = this.buffer;
    this.buffer = [];
    navigator.sendBeacon('/api/logs', JSON.stringify({ records }));
  }

  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    /* … */
  }
}
```

The one thing you cannot reliably catch from outside a provider is the moment
the tab closes. Implement the optional `flush()` above, and the library
calls it on `pagehide`, on `visibilitychange` going hidden (mobile browsers
routinely kill a backgrounded tab without ever firing `pagehide`), and on
teardown — so a queue like the one above never loses its last, still-pending
records. Leave `flush` out if you never buffer anything; it is optional, and
the library only calls it when it is there.

### Reading logs back

```ts
const lines = await this.logger.query({ correlationId: scenario.id });
```

`CpsLoggerService.query` just calls your backend, so the same service that
wrote a line fetches it back — you never touch `CPS_LOG_API_PROVIDER`
directly. Filter by `correlationId`, `logger`, `minLevel`, a time range, or
`limit`.

It fails open, like everything else: with no backend bound, or one that
rejects, it resolves to `[]` instead of throwing into a component. Records
come back exactly as they were stored — already redacted on the way out, so
there is nothing left to strip.

To get logs out as a **file**, just serialize whatever `query()` returns.
Pulling them out of CloudWatch instead would need credentials that can query
the entire log group, which is the wrong trade — see DESIGN.md §9.

### Named loggers

Declare a logger per area of the application and bind it once, instead of
repeating a label at every call:

```ts
// src/app/telemetry.schema.ts
declare module 'cps-telemetry' {
  interface CpsLoggerNames {
    checkout: true;
    admin: true;
  }
}

export {};
```

```ts
class CheckoutService {
  private readonly logger = inject(CpsLoggerService).getLogger('checkout');

  submit() {
    this.logger.log('Submitting order'); // -> { logger: 'checkout', … }
  }
}
```

The name lands on `record.logger` and is what per-logger levels, the debug
flag, and your own backend all key off. It is separate from `context`, which
stays free text describing what the individual line is about — `logger` says
_where the record came from_, `context` says _what it is about_, and only the
first one gets routed on.

Records written through the bare `CpsLoggerService` are simply unnamed.

### Sending loggers to different destinations

The library does not route anything for you. Every record reaches your
provider carrying its `logger`, so keeping streams apart is just a switch in
the one place that already knows where things go:

```ts
@Injectable({ providedIn: 'root' })
export class MyLogBackend implements CpsLogApiProvider {
  send(record: CpsLogRecord): void {
    const endpoint =
      record.logger === 'checkout' ? '/api/logs/checkout' : '/api/logs';

    void fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(record),
      keepalive: true
    }).catch(() => undefined);
  }
}
```

If a provider wants to batch per destination instead of sending each record
right away, it buffers into its own per-endpoint queues — the same as the
single-queue example above. Splitting streams does not change that pattern.

### Per-logger levels

`minLevel` is the floor for everything; `levels` overrides it by name, either
raising or lowering it:

```ts
provideCpsTelemetry(
  { application: 'shop', environment, version },
  withLogging({ minLevel: 'warn', levels: { checkout: 'log' } })
);
```

## Who is signed in

Telemetry is anonymous until you say otherwise. Attribution lives on the
sink, so one call covers both streams — logs and RUM events read the same
value from the same place, and can never drift apart:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private sink = inject(CpsTelemetrySink);

  onSignIn(user: User) {
    // An opaque id — never an email, a username or an account number.
    this.sink.setUserId(user.id);
  }

  onSignOut() {
    this.sink.setUserId(undefined);
  }
}
```

Sign-out is not just cosmetic. `pinUserId` has no inverse, so the RUM sink
starts a fresh session with a fresh anonymous id — otherwise the client would
keep attributing everything to the person who just left, which matters most
on a shared device. **So the session id changes as a result**, at the cost of
one `session_start` event and a re-rolled sampling decision.

In a fragment, this call is forwarded to the shell, so the whole composed
page agrees on who is signed in, no matter which realm made the call.

## Micro-frontends and web fragments

Each fragment runs in its own JavaScript realm, so each would otherwise build
its own AWS client — turning one visitor into N separate sessions, each with
its own slice of the event budget and its own copy of the SDK.

Instead, one realm hosts and the rest forward to it over `BroadcastChannel`:

```ts
// shell — owns the only AWS client
providers: [
  provideCpsTelemetry({ application: 'shell', environment: 'prod', version }),
  provideCpsTelemetrySink('rum'),
  provideCpsTelemetryBroadcastHost()
];

// fragment — no AWS client, no SDK bundle, no broker call
providers: [
  provideCpsTelemetry({ application: 'cart', environment: 'prod', version }),
  provideCpsTelemetrySink('broadcast')
];
```

Code inside a fragment does not change: same services, same calls. One
session, one budget, one bundle.

### Connecting a fragment

Two providers, and that is the whole integration:

```ts
bootstrapApplication(FragmentRoot, {
  providers: [
    provideCpsTelemetry({
      application: 'cart', // this fragment's own name
      environment: 'production',
      version: packageJson.version,
      eventNamespace: 'com.my-app' // must match the shell
    }),
    provideCpsTelemetrySink('broadcast')
  ]
});
```

**Settings that have to match the shell**

| Setting          | Rule                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventNamespace` | **Must match.** Otherwise your CloudWatch queries fragment along with your UI                                                                                                                                                    |
| Channel name     | **Must match.** The default (`CPS_DEFAULT_BROADCAST_CHANNEL`, `'cps-telemetry'`) needs no argument; if the shell passes a custom name, pass the same one — `provideCpsTelemetrySink('broadcast', { channelName: 'my-channel' })` |
| `application`    | **Should differ** per fragment. The forwarding sink stamps its realm's `application`, `environment` and `appVersion` onto every event it sends, so you can tell which fragment emitted what in the data                          |

**What a fragment must not provide**

| Do not                               | Why                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `provideCpsTelemetrySink('rum')`     | Builds a second AWS client — one visitor becomes two sessions, exactly what this arrangement is meant to avoid  |
| `CPS_RUM_CREDENTIALS_PROVIDER`       | Nothing in a fragment needs AWS credentials                                                                     |
| `provideCpsTelemetryBroadcastHost()` | Only one realm should host — a second one just wins or loses a leader election and idles either way (see below) |

The shell itself can safely be open in more than one tab: `BroadcastChannel`
is origin-wide, so every tab's host shares the same channel, but only one is
elected leader (a Web Locks-based election) and actually records forwarded
telemetry — the rest stay fully passive until the leader tab closes. See
DESIGN.md §13 for the mechanism.

### A fragment that also deploys standalone

Embedded, a fragment has to forward so the composed page keeps a single
session. Deployed on its own, there is no shell to forward to, so it needs its
own client. Which one applies is a fact about the deployment, so read it from
configuration instead of trying to detect it:

```ts
providers: [
  provideCpsTelemetry({
    application: 'cart',
    environment: environment.name,
    version: packageJson.version,
    eventNamespace: 'com.my-app'
  }),

  provideCpsTelemetrySink(environment.embedded ? 'broadcast' : 'rum'),

  // Used only in 'rum' mode; harmless when embedded.
  { provide: CPS_RUM_CREDENTIALS_PROVIDER, useExisting: CartRumCredentials }
];
```

| Mode          | Sends to                                  | Needs                                                |
| ------------- | ----------------------------------------- | ---------------------------------------------------- |
| `'broadcast'` | The shell's host, over `BroadcastChannel` | A shell running `provideCpsTelemetryBroadcastHost()` |
| `'rum'`       | AWS CloudWatch RUM directly               | `CPS_RUM_CREDENTIALS_PROVIDER`                       |
| `'noop'`      | Nowhere — everything runs, nothing ships  | Nothing. Useful for local development                |

Use `provideCpsTelemetrySink('broadcast', { channelName })` if the shell uses
a custom channel.

Application code stays identical across all three modes, so nothing outside
this provider list needs to be conditional. Note that in `'rum'` mode the
fragment is a full telemetry client on its own — its own session, its own
event budget. That is correct when it is the whole page, and exactly what
you are trying to avoid when it is not.

Deciding this here, rather than probing at runtime, is deliberate: a fragment
cannot tell synchronously whether a shell exists. Runtime detection would mean
buffering events during a probe window and losing the race if the shell boots
slowly — which produces the two sessions this arrangement exists to prevent.

### Continuing a shell journey

A `CpsScenario` is a class instance and cannot cross a realm, but its id is
just a string. Send it over whatever channel already carries your app state:

```ts
// shell publishes
new BroadcastChannel('app').postMessage({ scenarioId: checkout.id });

// fragment continues it
this.scenarioTelemetry.start({
  name: 'add-to-cart',
  parentScenarioId: msg.scenarioId
});
```

Both records then join on `parentScenarioId`.

### What to expect

- **`getSessionId()` is `undefined` for the first task.** A follower asks the
  shell for the session id when it is constructed, and the answer arrives one
  task later. Log records written in that window carry no `sessionId` — they
  are still correlated by `scenarioId`. Do not assert on it right at bootstrap.
- **Paint observation does not work in a fragment.** A `PerformanceObserver`
  inside a fragment watches its own hidden iframe, never the host frame where
  the pixels actually appear — so it will not fire. Settle with `complete()`
  instead.
- **A fragment with no shell still works.** If nothing is listening — no host
  yet, or the browser has no `BroadcastChannel` at all — the sink degrades to
  a no-op. Scenarios run, logs are written, nothing throws; the telemetry
  just is not shipped. A fragment developed standalone will not break, and starts
  reporting as soon as it is composed into a shell that hosts.

See DESIGN.md §13 for the reasoning and the remaining limits.

## Debugging

Off by default, in every environment. Set from DevTools, and nothing needs a
reload:

```js
localStorage.setItem('debugLogger', 'true');
localStorage.setItem('debugScenario', 'true');
localStorage.setItem('debugBI', '1');
```

`'true'` and `'1'` turn everything on. `debugLogger` also accepts a
comma-separated list of logger names, which is how you switch on one noisy
area without the rest:

```js
localStorage.setItem('debugLogger', 'checkout,cart');
```

## Privacy

Telemetry attributes are typed
`Record<string, string | number | boolean | null>` — flat and primitive-only,
so an object full of personal data cannot be passed in by accident.

**Page ids come from the RUM client, and they are resolved paths.** The client
patches `history.pushState` — which is how Angular navigates — and records a
page view as `location.pathname` on its own. The library does not wire up page
views at all, so there is nothing to configure here and nothing that
double-records.

The consequence is worth knowing: the current page id is stamped onto
**every** event recorded after it, so a parameter in the path reaches all of
them. If your routes carry identifiers, record page ids yourself instead —
walk the activated snapshot for the route template, call
`CpsRumTelemetrySink.recordPageView` with it on `NavigationEnd`, and set
`disableAutoPageView: true` in the RUM configuration so the client's own page
view recording is off. Concretely, that means a broker response like this:

```ts
// broker response
{
  config: {
    applicationId: '...',
    region: 'eu-west-1',
    applicationVersion: '1.0.0',
    disableAutoPageView: true
  }
}
```

A scenario's `route` field wants the same kind of template. Either way, the
client still captures the full `pageUrl` — keeping identifiers out of paths
is an application concern. On top of that, the library redacts values under
sensitive keys (`password`, `token`, `authorization`, `apiKey`, …), strips URL
query strings and fragments, normalizes errors to
`{ name, message, stack? }`, and caps every size. Arbitrary objects are never
serialized.

The key denylist only catches PII sitting under a conventionally-named key —
it cannot tell that a value under an innocuous key like `notes` happens to be
an email address. `redact.scanValuePatterns` closes part of that gap, opt-in,
off by default:

```ts
redact: {
  scanValuePatterns: ['email', 'creditCard', 'ssn'];
}
```

Available shapes: `'email'`, `'creditCard'` (Luhn-validated), `'ssn'`,
`'ipv4'`, `'phone'` (NANP and African countries). An
`extraValuePatterns: RegExp[]` field, shaped like `extraKeyPatterns`, covers
an application's own content patterns as regexes.

For redaction logic no regex can express, `extraValueTransforms` takes
plain functions instead — each receives a string (already scrubbed by
everything above) and returns the value to carry forward:

```ts
redact: {
  extraValueTransforms: [(value) => value.replace(/ACC-\d+/g, '[redacted]')];
}
```

A throwing transform is skipped, not fatal — logged in dev mode, the rest of
the pipeline keeps running.

### Turning redaction off per concern

`withLogging`/`withScenarios`/`withBiEvents` each take a `redact: boolean`
(default `true`), so you can turn off redaction for one concern without
touching the others:

```ts
withScenarios({ redact: false });
```

This only skips the _configurable_ scrubbing for that concern —
`extraKeyPatterns`, `scanValuePatterns`/`extraValuePatterns`, and URL-query
stripping. The built-in credential denylist (`password`, `token`, `secret`,
`apiKey`, …), size caps, error normalization, and `extraValueTransforms` all
keep applying regardless — those are safety guarantees, not privacy
opt-ins, so turning redaction "off" can't accidentally leak an actual
credential.

## Testing

The library ships **no test helpers**. Everything a test needs is already in
the main entry, and it comes down to three providers:

```ts
TestBed.configureTestingModule({
  providers: [
    provideCpsTelemetry({
      application: 'my-app-test',
      environment: 'test',
      version: '0.0.0'
    }),
    { provide: CPS_LOG_API_PROVIDER, useClass: RecordingLogBackend },
    { provide: CpsTelemetrySink, useClass: CpsNoopTelemetrySink }
  ]
});
```

Telemetry runs for real and is discarded; logs land in your test backend,
which is just two methods:

```ts
@Injectable()
class RecordingLogBackend implements CpsLogApiProvider {
  readonly records: CpsLogRecord[] = [];

  send(record: CpsLogRecord): void {
    this.records.push(record);
  }
  query(): Promise<CpsLogRecord[]> {
    return Promise.resolve(this.records);
  }
}
```

Nothing else is needed: the library does no batching of its own, so a record
reaches the provider as soon as it is written.

To assert on emitted telemetry, bind a sink that records instead of
discarding. `CpsTelemetrySink` is six methods, so the double is short and
stays yours to write:

```ts
@Injectable()
class RecordingSink extends CpsTelemetrySink {
  readonly events: { eventType: string; payload: object }[] = [];

  record(eventType: string, payload: object): void {
    this.events.push({ eventType, payload });
  }
  // recordError also takes an optional `metadata` second argument — a
  // sink can drop it, as here, or use it the way the RUM sink does, to
  // fold a broadcast-forwarded error's origin into its own record.
  recordError(): void {}
  getSessionId(): string | undefined {
    return 'test-session';
  }
  setUserId(): void {}
  getUserId(): string | undefined {
    return undefined;
  }
  flush(): void {}
}

TestBed.configureTestingModule({
  providers: [
    provideCpsTelemetry({
      application: 'my-app-test',
      environment: 'test',
      version: '0.0.0'
    }),
    { provide: CPS_LOG_API_PROVIDER, useClass: RecordingLogBackend },
    RecordingSink,
    { provide: CpsTelemetrySink, useExisting: RecordingSink }
  ]
});

TestBed.inject(RecordingSink).events.filter(
  (e) => e.eventType === CPS_TELEMETRY_EVENT_TYPE.scenario
);
```

One thing worth knowing if you are testing code that uses this library under
jsdom: jsdom implements no `BroadcastChannel`, so the broadcast sink degrades
to a no-op there. That is the documented, expected behavior — not a failure.

## Guarantees

- **Telemetry never breaks the application.** Every entry point is wrapped
  and never rethrows. In development, suppressed errors are still reported to
  the console so bugs surface; in production it stays silent.
- **SSR-safe.** Every browser-touching path is a no-op on the server.
- **Fail-open.** A broker outage, expired credentials, or an SDK throw all
  leave the application behaving exactly as it would with healthy telemetry.
