# Add `cps-telemetry`: a reusable Angular telemetry library, wired into `composition`

## Summary

Adds `cps-telemetry`, a new Angular library providing application logging,
scenario (user-journey) health telemetry, business/UX event tracking, and
PII redaction, with pluggable transport sinks — AWS CloudWatch RUM,
cross-realm broadcast (for micro-frontend compositions), and a no-op sink
for local development. Nothing in the library is specific to any one
application: event names, configuration, and AWS credentials are all
supplied by the host app.

The library has a single real runtime dependency, `tslib`. `aws-rum-web`
is an optional peer dependency, needed only when the RUM sink is used, so
an application using only the broadcast or no-op sink never pulls in the
AWS SDK. This is enforced structurally, not just by convention: the RUM
sink and its providers live in a separate secondary entry point,
`cps-telemetry/rum` (see "Two entry points" under Sinks below), so an
application that never imports from it never needs `aws-rum-web`
resolvable at build time either.

This PR also wires the library end-to-end into `composition`, the
component-library documentation/demo app, so every major capability
(scenarios, logs, BI events, redaction) is exercised by real, running
code rather than only by unit tests.

Architecture, design rationale, and a line-by-line verification of every
AWS RUM SDK capability claim (checked against the installed
`aws-rum-web@3.2.1` source, not just its docs) live in
`projects/cps-telemetry/DESIGN.md`. Usage documentation lives in
`projects/cps-telemetry/README.md`.

---

## Scenario telemetry

`CpsScenario` / `CpsScenarioTelemetryService` model one user journey — load
customer data, submit a form, run a search — as an object with steps,
aggregates, and a terminal outcome.

- **Five terminal statuses**: `success`, `failure`, `abandoned`,
  `incomplete`, `timeout`. There is no "in progress" status — a running
  scenario simply has none yet (`scenario.status` is `undefined` until
  settlement); `scenario.isSettled` answers whether it's done. Settling is
  absorbing: a second `complete()`/`fail()`/etc. after the first is a
  documented no-op, not a throw.
- **Automatic step management**: opening a step closes the previous one as
  completed; steps carry redacted metadata, an optional message, and a
  normalized error on failure. `steps[]` always has at least two entries
  (synthetic `scenario-start`/`scenario-end` boundary markers), even for a
  scenario that never calls `.step()`.
- **Aggregates** (`aggregateStart`/`aggregateEnd`) sum a repeatedly-invoked
  operation (a formatter run per row, a validator per field) into one total
  instead of one step per call, so a hot loop doesn't blow through the
  step budget or the record's own size.
- **Per-scenario timeout** (default 30s, configurable per call or globally,
  `0` disables): a scenario that never settles auto-settles as `timeout`
  rather than silently disappearing from the data.
- **Page-unload safety**: every in-flight scenario is settled as
  `abandoned` (`page-hidden`) on `pagehide`, with the sink flushed via
  `sendBeacon`. Concurrent scenarios (a dashboard loading three panels at
  once) are independent — there is no ambient "current scenario."
- **User Timings integration**: optional `performance.mark`/`measure`
  entries on the DevTools Performance track, gated by config or a
  LocalStorage debug flag. Marks are cleared at settle; a scenario with its
  timeout explicitly disabled and no navigation to clean it up is still
  guarded by an independent mark-cleanup fallback, so marks can't
  accumulate in the Performance buffer for the life of the page.
- **`elapsed` (the scenario and step timeline-position field) is built from
  the _host_ page's clock, not the local realm's.** It exists specifically
  so events from one session can be lined up against each other — but a
  fragment's own `performance.now()` runs from a later `timeOrigin` than
  the shell's, so a per-realm value would silently put shell- and
  fragment-originated records on two different, non-comparable timelines
  despite sharing one session id. `cpsElapsedNow()` prefers
  `top.performance.now()`, mirroring the same fix already applied to User
  Timing marks above, falling back to the local realm's clock if `top`
  throws (cross-origin, sandboxed).
- **`maxKeys` is enforced on the combined metadata, not each bag in
  isolation.** `setData()`, an outcome's metadata at settle, and a step's
  initial plus closing metadata are all merged through a shared helper
  that re-applies the cap to the merged result — a key already present is
  always updatable, but a genuinely new key is dropped once the combined
  count reaches `maxKeys`. Capping each bag independently before merging
  (the previous behavior) let the total grow past the configured bound.
- **`toRecord()`** is public and safe to call mid-flight — its `status`
  field is honestly typed as absent until the scenario has actually
  settled, and its returned `steps` and `metadata` are deep-cloned, not
  just a fresh array shell around shared objects, so mutating a mid-flight
  snapshot (including a nested step's own `metadata`) can never change
  what's later emitted at settlement.
- **`complete()`/`fail()`/`incomplete()`/`cancel()` share one signature** —
  `(outcome?: CpsScenarioOutcome)` — so custom metadata, status codes, a
  `reason`/`message`, and (for `fail()`) the thrown `error` are all
  available identically regardless of which one is called.
- **`traceScenario()`** RxJS pipeable operator bridges Observable streams
  directly to scenario completion/failure with optional outcome derivation,
  with the outcome mapper itself guarded so a throwing mapper still settles
  the scenario (as a success with no outcome) instead of crashing the
  subscription. A teardown that isn't a `complete`/`error` — a superseding
  `switchMap`, `takeUntilDestroyed()`, a manual unsubscribe — cancels the
  scenario instead of leaving it to self-settle as a `timeout`; guarded by
  `isSettled` so it never fires again after a real settle. That
  cancellation carries no `reason` unless `cancelOutcome` is supplied — a
  caller's own `scenario.cancel({ reason })` from a `switchMap` projector
  is always too late, since `switchMap` unsubscribes (and thereby settles)
  the prior inner Observable before the new projector ever runs.
- **`CpsScenarioTelemetryService.settled$`** is a public `Observable` of
  every scenario as it settles, plus `.find(scenarioId)` and
  `.getActive()` for introspecting in-flight scenarios — a debug overlay,
  a retry prompt, or a test harness can all build on this directly. Each
  emission is an independent deep copy, not the same object handed to the
  sink, so a subscriber mutating it can never change what was already (or
  is about to be) shipped; the copy is skipped entirely when nothing is
  subscribed, so the common unobserved case pays nothing for it.

## Logging

`CpsLoggerService` provides structured, leveled application logs, decoupled
from any specific backend.

- **No hard dependency on a sink**: logging's actual destination is the
  application's `CpsLogApiProvider`, not `CpsTelemetrySink` — a sink is
  only an optional enrichment source (session/user id correlation,
  RUM error mirroring). An application that wants only structured logging,
  with no scenarios, BI events, or RUM at all, is not required to configure
  any sink to use it, unlike `CpsScenarioTelemetryService`/
  `CpsBiTelemetryService`, which still fail at bootstrap without one.
- **Per-logger minimum levels**, overridable per named logger, so one noisy
  area can run verbose while the rest of the app stays quiet.
- **Delivery is entirely the application's `CpsLogApiProvider` policy**: the
  library does no batching of its own — `send()` is called once per record,
  as it is written. A provider that wants to batch, retry, or authenticate
  does so on its own terms, with full knowledge of what its endpoint
  accepts.
- **Flush reliability at the end of a session**: a provider's optional
  `flush()` is called on `pagehide`, on `visibilitychange` going hidden
  (the case mobile browsers routinely produce by killing a backgrounded tab
  without ever firing `pagehide`), and on teardown — so a provider that
  chooses to queue its own records doesn't lose the last, still-pending
  ones when the tab closes.
- **Correlation**: passing a scenario's `logger` binds its id as
  `correlationId` on every line that logger writes, so frontend logs,
  frontend telemetry, and backend logs can be reassembled into one journey.
  `correlationId` is scrubbed the same way every other string field on a
  log record is — normally a plain scenario uuid, unaffected either way,
  but nothing enforces that at runtime, so a caller accidentally binding
  something sensitive there no longer bypasses redaction on its way to the
  application's own log backend.
- **`debugLogger` LocalStorage flag** mirrors records to the console
  (optionally scoped to specific logger names), independent of production
  configuration, so a deployed build can be inspected from DevTools without
  a redeploy. Console lines from all three concerns are prefixed
  `[<application>][<concern>]` rather than with this library's own name —
  the same application-first rule already used for User Timing entry names,
  so that in a composed page the realm a line came from is visible at a
  glance instead of every realm sharing one indistinguishable prefix.
- **`CPS_LOG_LEVEL_ORDER`** is exported, so a consumer's own log-query
  filtering can compare levels without re-declaring the ordering.

## Business/UX events

`CpsBiTelemetryService.track()` records discrete, durationless events —
feature adoption, interaction analysis, funnel steps — supplied entirely by
the application (the library defines no business vocabulary of its own).

- **Double-fire absorption**: an identical event — same name, scenario
  correlation, event-type override, feature, and metadata content — within
  a 400ms window is collapsed, covering the common case of a handler bound
  to both `click` and `keydown`. The dedup key includes metadata content
  specifically so two different-but-same-named events in quick succession
  (two different theme options picked back to back) are never mistaken for
  a double-fire of one, and includes `eventType`/`feature` so two events
  that only differ in those fields are never dropped as duplicates of each
  other — the dedup key is built with `JSON.stringify`, not delimiter
  joining, so e.g. `eventType: 'x|y', feature: 'z'` can no longer collide
  with `eventType: 'x', feature: 'y|z'` the way naive `${a}|${b}` joining
  would. The key cap's oldest-entry eviction now actually evicts the oldest
  entry: a key re-emitted after its own dedup window elapses is deleted and
  reinserted, not merely updated in place, so it moves to the front of the
  `Map`'s iteration order the way its refreshed timestamp implies — without
  this, a just-refreshed key could still look "oldest" by insertion order
  and get evicted at capacity, letting an immediate duplicate straight
  through right after. A duplicate hit refreshes the same position without
  extending the window — otherwise a frequently-duplicated ("hot") key,
  the only kind that never reaches that refresh, would stay pinned at
  whichever position it held from its very first insertion and become the
  prime eviction candidate precisely because it's actively in use.
- **Monotonic timing**: the dedup window is measured against
  `performance.now()`, not the wall clock, so it can't be wedged by a
  backward time jump (an NTP correction, a device waking from sleep).
- **The dedup key is built from redacted metadata**, not the raw values
  passed to `track()` — `metadata` and `feature` are both scrubbed once,
  up front, and the redacted result is reused for the key and the emitted
  event alike. Building the key from raw values first would leave
  sensitive content sitting as a `Map` key in this root service's memory
  for the page lifetime, even though the emitted event was correctly
  redacted all along.

## PII redaction

`cps-telemetry-redact.util.ts` provides the shallow, synchronous redaction
pass every metadata object, log message, and normalized error goes through
before reaching a sink.

- **Key-name denylist**, extensible per-application via
  `extraKeyPatterns`, catches conventionally-named sensitive fields
  (`password`, `token`, `secret`, `ssn`, …) regardless of value shape.
- **Opt-in value-content scanning** (`scanValuePatterns`) additionally
  redacts email addresses, credit-card numbers (Luhn-validated to avoid
  false positives on unrelated digit runs), SSNs, IPv4 addresses, and phone
  numbers found _inside_ a string value, not just under a suspicious key
  name — closing the gap where PII lands under an innocuous key. Off by
  default; each entity type is opted into individually. The `'phone'`
  pattern covers NANP (US/Canada) numbers plus international-format numbers
  from South Africa, Botswana, Ghana,
  Kenya, Mauritius, Mozambique, Namibia, Seychelles, Tanzania, Uganda,
  Zambia.
- **URL scrubbing** strips query strings and fragments wherever a URL
  appears in a string, including one embedded inside a longer message, not
  only when the whole string is a bare path.
- **Error normalization** (`cpsNormalizeError`) redacts stack traces and
  messages, and specifically recognizes `HttpErrorResponse`-shaped objects
  (structurally, without importing `@angular/common/http`) so an HTTP
  failure's name/message survive normalization instead of being flattened
  to a generic, unhelpful `Error`.
- **`extraValueTransforms`** — application-supplied `(value: string) =>
string` functions run on every string value after all pattern-based
  scrubbing, an escape hatch for redaction logic no regex can express. A
  throwing transform is skipped (logged in dev mode only), not fatal, and
  never blocks the rest of the pipeline.
- **Per-concern redaction toggle**: `withLogging`, `withScenarios`, and
  `withBiEvents` each accept a `redact: boolean` (default `true`). Turning
  it off for one concern disables only the _configurable_ PII scrubbing
  (`extraKeyPatterns`, value-pattern scanning, URL-query stripping) for
  that concern — the built-in credential denylist, size caps, error
  normalization, and `extraValueTransforms` are a safety floor and stay on
  regardless, via `cpsRedactConfigFor()`.
- **Per-resolved-config isolation**: `extraKeyPatterns`/`extraValuePatterns`/`extraValueTransforms`
  arrays are always copied fresh per `provideCpsTelemetry()` call, so
  mutating one application's array can never leak into another's.

## Sinks

`CpsTelemetrySink` is the six-method abstraction every sink implements;
applications inject the same services regardless of which is active.

- **RUM sink** (`CpsRumTelemetrySink`) wraps `aws-rum-web`, lazy-loaded so
  the SDK is never in an application's bundle unless the RUM sink is
  actually selected.
  - **Two entry points.** `CpsRumTelemetrySink`, `provideCpsTelemetryRumSink`,
    and everything `CpsRumCredentialsProvider`-shaped are exported from a
    separate secondary entry point, `cps-telemetry/rum`, not the main
    `cps-telemetry` barrel. Lazy-loading `aws-rum-web` at runtime prevents
    it from being _bundled_ unless reached, but does not prevent it from
    being _resolved_ — a static `import` is parsed as part of building the
    module graph before any dead-code elimination runs, and a bundler must
    resolve a dynamic `import()`'s specifier at build time to construct its
    lazy chunk regardless of whether that branch ever executes. So keeping
    `CpsRumTelemetrySink` out of the main entry point's module graph
    entirely — not just tree-shaking it — is what lets an application
    using only `provideCpsTelemetrySink('broadcast' | 'noop')` skip
    installing `aws-rum-web` altogether. The cost: ng-packagr hardcodes
    each entry point's TypeScript `rootDir` to that entry's own directory,
    so `cps-telemetry/rum` cannot reach the main entry's internal
    `cpsSafe`/`cpsIsBrowser`/`cpsUuid`-style helpers by relative import;
    rather than exporting them publicly just to satisfy that constraint, it
    carries a small verbatim private copy of its own. See DESIGN.md §3,
    "Entry points", for the full reasoning.
  - Exposes the library's near-complete `aws-rum-web` configuration
    surface (sampling, session behavior, dispatch/buffering, cookies,
    page tracking, tracing) through `CpsRumAppMonitorConfig`, hand-typed so
    no SDK types leak into the public API; every field with a real SDK
    default is left unset unless the application overrides it, so the
    library's defaults never drift from the SDK's own.
  - Credentials come from an application-supplied
    `CpsRumCredentialsProvider`; a failed or unreachable broker degrades to
    a disabled-but-non-throwing sink rather than breaking the app.
  - Credential refresh retries on failure instead of the refresh chain
    dying permanently after one transient error, and is safe against the
    destroy/async race where the sink is torn down while a refresh (or the
    initial client construction) is still in flight. A refresh due to fire
    immediately — already-expired or newly-issued credentials expiring
    within the refresh skew window — falls back to the same bounded retry
    delay instead of scheduling an immediate refresh, so a broker stuck
    returning bad credentials can't tight-loop the sink.
  - A credential refresh returning `null` disables RUM for the session, as
    documented on `CpsRumCredentialsProvider.load()`: the client is torn
    down — the SDK's own `disable()` is called on the live instance, not
    just the reference dropped, so its listeners, plugins, and dispatch
    timer actually stop — rather than continuing to collect with now-stale
    credentials, and events recorded after that point are dropped rather
    than silently queued forever in the pre-init buffer. The same teardown
    runs on `ngOnDestroy()`, so an Angular-destroyed sink can't leave an
    orphaned client still collecting (and, if the app is bootstrapped
    again in the same page, duplicating telemetry).
    The very first load honors the identical contract, not only a later
    refresh — declining before the client is ever constructed, or the SDK
    throwing anywhere in the init sequence (construction, or applying
    identity/credentials to an already-constructed client), now also
    disables the session and discards the pre-init buffer, instead of
    leaving every subsequent `record()` call buffering into the capped
    pre-init queue forever, a stale `flush()` warning about init being
    unfinished when it had actually just been declined, or — for a throw
    after construction — an orphaned, still-running client nothing ever
    tore down.
  - A bounded pre-init buffer means telemetry recorded before the RUM
    client finishes initializing is not silently lost, and a dev-mode
    warning fires specifically when the page unloads before that
    resolution — not when the buffer is instead cleared because RUM was
    declined or failed to initialize, which is a deliberate silent
    discard, not an unload-mid-init loss. `record()`,
    `recordPageView(pageId)`, and `recordError(error)` all buffer and
    replay identically — an error mirrored from `CpsLoggerService` (or
    reported directly) before the SDK loads is preserved, not dropped.
    The three record/buffer/dispatch call sites share one internal
    helper, so the guard can't drift between them.
  - `CpsRumAppMonitorConfig.clientBuilder` is typed on `aws-rum-web`'s own
    `ClientBuilder` parameter shape in full (`endpoint: URL, region:
string, credentials?: ClientBuilderCredentials, compressionStrategy?:
{ enabled: boolean }`) rather than `(...args: unknown[]) => unknown` —
    the latter looks more
    permissive but is actually the opposite: TypeScript checks function
    parameters contravariantly, so a real, concretely-typed `ClientBuilder`
    is not assignable to a parameter typed `unknown`, and the escape hatch
    could never be used without a cast.
- **Broadcast sink/host** (`CpsBroadcastTelemetrySink` /
  `CpsTelemetryBroadcastHost`) let a micro-frontend fragment forward its
  telemetry to the shell that owns the real RUM client, so a composed page
  gets one AWS session and one event budget instead of one per fragment.
  Session id **and** user id are synced two-way across every realm on the
  channel — a user id set in one fragment is visible to a sibling
  fragment's own logs, not just to the shell.
  - The shell can safely run in more than one tab without double-recording
    one event: `CpsTelemetryBroadcastHost` holds a Web Locks-based leader
    election per channel, so only the elected tab records forwarded
    telemetry. "Passive" describes the losing tab's _host_ only, not its
    fragments — they keep forwarding on the same origin-wide channel
    regardless, so their events are recorded (once, not lost) through the
    _winning_ tab's AWS RUM client, attributed to that tab's session and
    page rather than their own. If the same composed page could
    realistically be open in more than one tab, give each tab's own
    instance a unique channel name to avoid this — see README.md
    "Multiple tabs of the same composed page" and DESIGN.md §13 "Known
    limits". Fails open (elects
    immediately) when the Locks API is unavailable, or if a lock request
    itself is rejected — or throws synchronously instead of rejecting,
    guarded the same way now that this runs unguarded inside an
    `APP_INITIALIZER`, where an uncaught throw would otherwise crash
    application bootstrap rather than just fail to elect a leader. A tab
    destroyed while its own election is still
    queued (never granted) no longer deadlocks the channel — it is
    recognized as released the moment it is granted, and the lock passes
    straight to the next queued tab instead of being held forever by one
    that already closed.
  - A genuine duplicate host provider (e.g. `provideCpsTelemetryBroadcastHost()`
    supplied in both a root and a lazy-loaded module) is detected and warned
    about via a small same-realm registry, not the `identity` broadcast —
    the broadcast is origin-wide and can't tell a real duplicate apart from
    a different, legitimate tab, which must never warn.
  - Every message kind on the wire protocol is now field-validated, not
    just its `kind` discriminant — `identity`'s `sessionId`/`userId` and a
    forwarded error's `stack` are all type-checked before being trusted.
    An `event`/`error` message's optional `metadata` is validated too, not
    just passed through: any same-origin code can post to a
    `BroadcastChannel` by name, and without this a payload with a nested
    object/array value would reach a receiving sink's own sanitizer (e.g.
    `CpsRumTelemetrySink.sanitize()`, which trusts the shape rather than
    re-checking it) unvalidated.
  - A forwarded error carries the originating fragment's identity through
    the wire protocol; since the underlying AWS RUM client's `recordError`
    has no metadata parameter to carry it, the RUM sink folds a
    cross-realm origin into the error's `name` (e.g. `[fragment-app]
TypeError`) rather than losing it and attributing every fragment error
    to the shell.
- **No-op sink** for local development and testing — telemetry calls
  succeed and do nothing, so a fragment developed standalone never breaks
  for lack of a shell to compose into. Every override keeps the abstract
  `CpsTelemetrySink` method's full parameter list rather than narrowing to
  zero arguments — TypeScript's bivariant method-override checking would
  have allowed the narrower form to still satisfy `extends
CpsTelemetrySink`, but it would make the _concrete_ `CpsNoopTelemetrySink`
  type itself reject a normal call like `.record(type, payload)`.
  `getUserId()` retains what `setUserId()` was last given, rather than
  always reporting `undefined` — the one piece of state this sink can't
  just discard along with everything else, since `CpsLoggerService` reads
  it for user correlation on every log record, and logs still reach a real
  `CPS_LOG_API_PROVIDER` even in noop mode.

## Configuration & providers

- `provideCpsTelemetry(identity, ...features)` takes the application's
  identity (`application`/`environment`/`version`, event namespace) as a
  mandatory first argument, composed with optional, independently
  omittable `withLogging(...)`, `withScenarios(...)`, `withBiEvents(...)`,
  `withRedaction(...)` features — mirroring Angular's own
  `provideHttpClient(withInterceptors(...))` convention. Each concern gets
  its own DI token (`CPS_LOG_CONFIG`, `CPS_SCENARIO_CONFIG`,
  `CPS_BI_CONFIG`, `CPS_REDACT_CONFIG`, plus `CPS_TELEMETRY_IDENTITY` for
  identity), so a consumer can override one concern through plain DI
  substitution without touching the others. BI event tracking (dedup
  window and key cap) is configurable via `withBiEvents(...)` rather than
  fixed at hardcoded constants.
- `provideCpsTelemetrySink('broadcast' | 'noop')`,
  `provideCpsTelemetryRumSink()` (from `cps-telemetry/rum`), and
  `provideCpsTelemetryBroadcastHost()` select the transport explicitly —
  there is no default destination, so an app can never look wired up while
  silently shipping nothing.
- Scenario, step, and logger names are typed as a closed vocabulary via
  TypeScript module augmentation (`declare module 'cps-telemetry'`), so a
  typo in a name is a compile error instead of a second, silently
  incomplete metric series.

---

## `composition` integration

Wires the library into real, running pages rather than only into unit
tests. `AppTelemetryService` (new) owns route-navigation scenario tracking
and application-level BI/log calls, and logs `'Application started'`
(with the browser's `navigator.language`, when running in one — `start()`
is called unconditionally from `AppComponent`, before its own
`isPlatformBrowser` check, so this is `isPlatformBrowser`-gated internally
too, to stay safe if `composition` ever gains an SSR target) once
tracking begins to bound the session in the log stream; the page-level
integrations below build on it:

- **Route navigation** — every router navigation is a scenario
  (`resolve-route` → `activate`), giving concurrent/superseded navigations
  real coverage. A sidebar nav-link click is recorded via
  `markNavigationIntent()` and backdates the scenario's start to the click
  itself rather than the router's own (slightly later) `NavigationStart`,
  so event-handling/guard/change-detection time is counted as part of the
  wait the user actually experienced. A route landed on without its tab
  segment (e.g. bare `/checkbox`) is redirected to `examples` by a
  `CanMatch` guard (`defaultTabRedirectGuard`); since any guard-returned
  redirect restarts navigation under a new id, `AppTelemetryService`
  recognizes that specific restart (`NavigationCancel`'s
  `code === NavigationCancellationCode.Redirect`) and continues the same
  scenario into the follow-up navigation instead of opening a second one —
  one user-visible navigation still produces exactly one scenario record.
  `NavigationSkipped` (a terminal event, notably for same-URL navigation)
  is handled too: it clears any pending click-intent and settles any
  scenario already opened for that navigation id, so a skipped navigation
  can't leave a stale intent around to wrongly backdate the _next_,
  unrelated navigation within the 2s freshness window.
- **File upload** — processing scenarios are tracked per upload widget
  (keyed by filename), so two `<cps-file-upload>` widgets sharing the same
  processing callback can be interacted with independently without one's
  cancel affecting the other's in-flight scenario; a scenario still
  processing when the page navigates away is cancelled, not leaked. Every
  widget on the page — including the one demonstrating a failing callback
  — wires `(fileProcessingCancelled)` to cancel its own scenario; without
  it, clicking that widget's cancel button unsubscribes the processing
  pipeline before the scenario ever learns the user cancelled, leaving it
  to self-settle as a `timeout` 30s later instead of an immediate,
  accurate cancellation. A successful upload settles its scenario directly
  in the processing pipeline's own `next`/`error` handlers rather than via
  `traceScenario`'s stream-completion hook: `CpsFileUploadComponent` wraps
  the callback's observable in `take(1)`, which unsubscribes right after
  the first value — before the source's own `complete` notification would
  reach a downstream `tap()` — so a successful upload would otherwise never
  call `scenario.complete()` and would sit active until its own timeout.
- **Autocomplete** — search scenarios per widget (single/multi), with
  supersede-on-new-query cancellation; a search or validation error is
  caught, settles the scenario as failed, and leaves the search pipeline
  able to serve future queries rather than dying after the first failure.
  Selecting an option to validate follows the same supersede pattern: a
  newer selection cancels a still-running validation via `switchMap`
  rather than the two running independently and clobbering each other's
  state, and the validating indicator is reliably cleared on both the
  success and error paths. The `reason: 'superseded'` on that cancellation
  is threaded through `traceScenario`'s `cancelOutcome`, not a direct
  `scenario.cancel(...)` call — the latter would be a no-op here, since
  `switchMap` already settles the prior scenario before a manual cancel in
  the new projector could run.
- **Table lazy-load** — server-side page fetches are tracked as scenarios,
  cancelling a superseded in-flight load. A destroy landing between the
  load's queued microtask and the timer it schedules is guarded against
  explicitly, so a page navigated away from doesn't have its (already
  unmounted) state mutated once that timer fires.
- **Sidebar search** — reports a debounced BI event once typing pauses,
  not per keystroke, so the RUM session's event budget isn't spent on
  intermediate keystrokes.
- **Theme options / code-example copy / sidebar collapse** — BI events for
  feature adoption tracking (`theme_option_changed`, `code_copied`,
  `sidebar_toggled`).
- **Bare `console.warn` calls replaced with the structured logger** in
  three places — a route missing a `<title>` (`routing` logger, offending
  URL as context), a code example missing both `htmlCode` and `tsCode`,
  and a failed clipboard-copy — each now reports through `CpsLoggerService`
  instead of an unstructured console line.
- Every component above cancels its own in-flight scenario(s) on
  `ngOnDestroy`, so navigating away mid-journey doesn't leave the scenario
  registry (or the RUM event budget) accumulating abandoned entries.
- `resolveDeploymentEnvironment()` — this workspace has no
  `environment.ts`/`fileReplacements` build variant, so
  `provideCpsTelemetry`'s `environment` is derived from
  `window.location.hostname` at bootstrap instead of a hardcoded literal:
  recognized local-dev hostnames (`localhost`, `127.0.0.1`, `[::1]`,
  `0.0.0.0`) resolve to `'development'`, everything else to `'production'`.
  The classification rule (`classifyHostname`) is a pure function, unit
  tested directly; the thin `window`-reading wrapper around it is not
  meaningfully testable under jsdom and isn't.
- `AppLogApiProvider` — an in-memory ring-buffered log backend standing in
  for a real endpoint, with a browser-side JSON export. The download's
  temporary anchor is created before, and removed in a `finally` alongside
  the object URL — not both inside the same `try` after `.click()` — so a
  `click()` that throws can't leave the anchor stuck in the DOM forever.
- `AppRumCredentialsProvider` — the credentials-broker integration point,
  requesting `/rum/init` with `cache: 'no-store'` since the response
  carries live, temporary AWS credentials that must never be served stale
  from the browser's HTTP cache.
- `telemetry.schema.ts` — this application's declared scenario/step/logger
  vocabulary.

## Documentation

- **`DESIGN.md`** — the library's architecture, the reasoning behind each
  design decision, and a capability-by-capability verification of what
  `aws-rum-web` actually supports, checked against the installed SDK
  source rather than assumed from its public documentation.
- **`README.md`** — setup, scenario/logging/BI usage, redaction
  configuration, advanced RUM configuration, debugging flags, and testing
  guidance for consumers of the library.
- **`telemetry-trace.capture.spec.ts`** (`projects/composition/src/app/`)
  — drives `composition`'s real services with
  `debugScenario`/`debugLogger`/`debugBI` enabled and captures the exact
  payloads handed to the sink and the log API provider, including
  synthetic cases (`incomplete`, `exceededStepsLimit`, `mirrorErrorsToRum`,
  redaction) as a concrete, reviewable example of the emitted payload
  shapes described in `DESIGN.md`. Regenerate with `npm run trace:telemetry`;
  the JSON it produces isn't committed (see `.gitignore`).

## Workspace wiring

- `angular.json` gains the `cps-telemetry` library project (ng-packagr
  build, dev/production `tsconfig` split); `tsconfig.json` adds it to the
  workspace's project references.
- `projects/cps-telemetry/rum/ng-package.json` declares the
  `cps-telemetry/rum` secondary entry point (ng-packagr discovers it
  automatically by scanning the primary package's directory for nested
  `ng-package.json` files — no separate `package.json` or `angular.json`
  project entry is needed for a secondary entry point).
- `jest.config.js` maps both the `cps-telemetry` and `cps-telemetry/rum`
  import specifiers to source, the same way `cps-ui-kit` already is, so
  tests and the IDE resolve them without a prior build; `tsconfig.json`'s
  `"paths"` gets the matching pair of entries.
- `projects/cps-telemetry/rum/tsconfig.lib.json` /
  `tsconfig.spec.json` (new) and their addition to the root `tsconfig.json`'s
  `"references"` — ng-packagr generates its own tsconfig per entry point
  internally and doesn't need these, but without them nothing covered the
  `rum/` directory as a TypeScript project, so `tsc --build` and the IDE's
  language service couldn't resolve its `cps-telemetry` import at all.
- CI (`.github/workflows/cps-shared-ui-checkers.yml`) gains a
  `build:telemetry` step and a `test:cps-telemetry` step alongside the
  existing `cps-ui-kit` ones, plus a `build:documentation` step building
  `composition` itself — the one thing in this repo that actually imports
  `cps-telemetry`/`cps-telemetry/rum` and exercises the real, bundled
  integration; without it, a secondary-entry-point resolution failure or
  other integration break could merge with every other check green.
- Root `package.json` gains `build:telemetry`/`test:cps-telemetry` scripts
  and `aws-rum-web` as a dependency (for `composition`'s real use of the RUM
  sink); `projects/cps-telemetry/package.json` /
  `projects/cps-telemetry/ng-package.json` declare the new library's own
  metadata, peer dependencies, and ng-packagr output configuration.
- `projects/composition/tsconfig.app.json` gains `skipLibCheck: true` —
  needed because `aws-rum-web` pulls in `rrweb` typings that don't compile
  under this workspace's TypeScript settings — and an explicit `rootDir:
"../../"`, matching its sibling `tsconfig.spec.json`'s existing setting;
  without it, `composition`'s own path-mapped imports of `cps-ui-kit`/
  `cps-telemetry` source (outside its own directory) violated TypeScript's
  rootDir check. `projects/composition/tsconfig.json` — the plain
  `tsconfig.json` VS Code's language service actually resolves first when a
  file is opened, separate from `tsconfig.app.json` — gets both the same
  `rootDir` fix and `skipLibCheck: true`, for the identical reasons.

## Testing

- **636 tests** in `cps-telemetry`, **264 tests** in `composition`, all
  passing.
- Lint clean across the workspace.
- Both production builds (`cps-telemetry` library build,
  `composition` documentation-site build) succeed with no compiler or CommonJS warnings.
- The test suite includes mutation-checked coverage of every
  concurrency/lifecycle-sensitive path (destroy-time cancellation,
  credential-refresh retry with 32-bit overflow protection, the scenario
  timeout rescheduling itself (rather than settling early) when a clamped
  32-bit-overflow-protection hop fires before the real configured deadline,
  the mark-cleanup fallback timer sharing that same overflow protection
  (accepting an early fire there, since it's harmless cleanup hygiene, not
  a status determination), `elapsed`'s host-page-relative clock, cross-realm identity sync, redaction ordering,
  dedup keying, RxJS operator stream settlement, the leader-election
  destroy-while-queued race, `settled$`'s copy-on-emit, the dedup key-cap
  eviction-ordering fix, a successful upload settling under `take(1)`,
  `traceScenario`'s cancel-on-unsubscribe path, the dedup key's
  `JSON.stringify` collision fix, `CpsNoopTelemetrySink`'s `getUserId()`
  retention, the download anchor surviving a throwing `click()`, the
  initial-load disable-flag parity, the dedup cache's hot-key eviction
  fix, the leader election's synchronous-throw fail-open, per-call
  `extraValueTransforms` isolation, `correlationId` scrubbing, the
  pre-init buffer discard (not just a stopped future-buffering) on a
  declined or failed init, the aggregate-freeze-at-settlement fix, the
  BI dedup key being built from redacted rather than raw metadata,
  `maxKeys` being re-applied to combined scenario/step metadata rather
  than to each independently-capped bag before merging, the same-realm
  duplicate-host registry, `traceScenario`'s `cancelOutcome` winning
  the race against a `switchMap`'s own prior-subscription teardown, the
  broadcast wire protocol's `metadata` field being validated as flat
  primitives rather than passed through unchecked, the duplicate-host
  diagnostic warning itself being fail-open (a patched, throwing
  `console.warn` can't crash host construction), and
  `AppTelemetryService`'s `NavigationSkipped` handling clearing a stale
  click-intent that would otherwise backdate an unrelated navigation) —
  each such test
  was verified to actually fail when its corresponding guard is removed,
  not only to pass against the current implementation.
  `CpsRumAppMonitorConfig.clientBuilder`'s completed parameter signature is
  verified two ways: a runtime test whose inline `clientBuilder`
  implementation leaves `credentials`/`compressionStrategy` unannotated,
  relying on the field's own type for contextual inference; and, like
  `CpsNoopTelemetrySink`'s preserved method signatures, at the type level
  (`tsc --build`) — since ts-jest itself runs with `diagnostics: false`,
  neither jest nor this workspace's own `npm run typecheck` would catch a
  regression here on its own, see "Known gaps" below.

### Known gaps

- **`npm run typecheck` (`tsc --noEmit`) is currently a no-op.** The root
  `tsconfig.json` is solution-style — `"files": []` plus per-project
  `"references"` — and plain `tsc --noEmit` only checks a config's own
  `"files"`/`"include"`, not its references; following references needs
  `tsc --build`. Confirmed directly: with a real type error introduced
  (temporarily, while verifying the `clientBuilder` fix above), `npm run
typecheck` still exited `0` with no output. `tsc --build` does catch it,
  but currently also reports roughly 100 pre-existing errors across the
  workspace unrelated to this PR (`aws-rum-web`'s bundled `rrweb` typings;
  ambient Node globals `@types/node` would otherwise supply, since this
  workspace's `tsconfig`s deliberately omit it — see `cps-telemetry`'s own
  `types: ["jest"]` convention). Pre-existing, not introduced by this PR;
  switching the script to `tsc --build` would immediately need triaging
  those separately. Left as-is here; flagging for a follow-up.
