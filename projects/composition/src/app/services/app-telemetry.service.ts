import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router
} from '@angular/router';
import {
  CpsBiTelemetryService,
  CpsLoggerService,
  CpsScenario,
  CpsScenarioTelemetryService,
  CpsTelemetryMetadata
} from 'cps-telemetry';
// Side-effect import for the module augmentation declaring the scenario and
// step vocabulary used below.
import './telemetry.schema';

/** Name shared by every route-navigation scenario. */
const NAVIGATION_SCENARIO = 'route-navigation';

/** Beyond this, a recorded click is assumed not to have caused the navigation. */
const INTENT_MAX_AGE_MS = 2_000;

/**
 * Wires the documentation app's own telemetry: tracks route navigations as
 * scenarios and forwards BI and log events.
 *
 * Started from `AppComponent` so it is created once the application is running.
 */
@Injectable({ providedIn: 'root' })
export class AppTelemetryService {
  private readonly router = inject(Router);
  private readonly scenarioTelemetry = inject(CpsScenarioTelemetryService);
  private readonly biTelemetry = inject(CpsBiTelemetryService);
  private readonly logger = inject(CpsLoggerService).getLogger('app');
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Angular identifies concurrent navigations by id, so scenarios are keyed the
   * same way. A single "current navigation" field would attribute the wrong
   * duration whenever one navigation supersedes another.
   */
  private readonly navigations = new Map<number, CpsScenario>();

  private pendingRedirectScenario?: CpsScenario;

  /** When the user last did something that should start a navigation. */
  private navigationIntentAt?: number;

  private started = false;

  /** Begins tracking router navigations. Safe to call more than once. */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    // Marks the start of a session in the log stream. Application, environment
    // and version are stamped onto every record by the logger, so this line
    // exists to bound the session rather than to carry them.
    this.logger.log('Application started', {
      context: 'AppTelemetry',
      metadata: this.isBrowser ? { language: navigator.language } : undefined
    });

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onRouterEvent(event));
  }

  /**
   * Records that the user just did something expected to start a navigation.
   *
   * The router raises `NavigationStart` a little after the click that caused it —
   * event handling, guards and change detection all run first. Measuring from
   * here rather than from the router event keeps that gap, which the user
   * experienced as part of the wait, inside the recorded duration.
   */
  markNavigationIntent(): void {
    this.navigationIntentAt = Date.now();
  }

  /**
   * Records a business event for a theme change.
   *
   * @param theme the theme the user switched to
   */
  trackThemeChanged(theme: string): void {
    this.biTelemetry.track('theme_changed', { theme });
  }

  /**
   * Records a meaningful user interaction.
   *
   * Repeat clicks within a short window are collapsed by the telemetry layer,
   * so no throttling is needed here.
   *
   * @param action the interaction name, e.g. `export_clicked`
   * @param metadata attributes describing the interaction — ids, route names
   *   and tab names only, never emails, usernames or account numbers
   */
  trackClick(action: string, metadata?: CpsTelemetryMetadata): void {
    this.biTelemetry.track(action, metadata);
  }

  private onRouterEvent(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      const scenario =
        this.consumePendingRedirectScenario() ??
        this.scenarioTelemetry.start({
          name: NAVIGATION_SCENARIO,
          operation: 'lazy-route-load',
          route: this.routeTemplate(event.url),
          // The journey began when the user clicked, which is a little
          // before this handler runs. Backdating to the router's own event
          // timestamp keeps that gap inside the measurement.
          startedAt: this.navigationStartedAt(),
          // A navigation that has neither completed nor been superseded
          // within this window is a stuck chunk load, not a slow one.
          timeoutMs: 30_000
        });
      scenario.step('resolve-route');
      this.navigations.set(event.id, scenario);
      return;
    }

    if (event instanceof NavigationEnd) {
      this.settle(event.id, (scenario) => {
        scenario.step('activate');
        scenario.complete({
          metadata: { finalUrl: event.urlAfterRedirects }
        });
      });
      return;
    }

    if (event instanceof NavigationCancel) {
      const scenario = this.navigations.get(event.id);
      if (scenario && event.code === NavigationCancellationCode.Redirect) {
        this.navigations.delete(event.id);
        this.pendingRedirectScenario = scenario;
        return;
      }

      this.settle(event.id, (scenario) =>
        scenario.cancel({ message: event.reason || 'navigation-cancelled' })
      );
      return;
    }

    if (event instanceof NavigationSkipped) {
      this.navigationIntentAt = undefined;
      this.settle(event.id, (scenario) =>
        scenario.cancel({ message: event.reason || 'navigation-skipped' })
      );
      return;
    }

    if (event instanceof NavigationError) {
      this.settle(event.id, (scenario) => {
        // The scenario id doubles as the correlation id, which is what lets
        // this line and the scenario record be pulled together afterwards.
        this.logger.error('Navigation failed', {
          error: event.error,
          context: NAVIGATION_SCENARIO,
          correlationId: scenario.id,
          metadata: { url: event.url }
        });
        scenario.fail({ error: event.error });
      });
    }
  }

  /**
   * Reduces a router event's URL to a route template.
   *
   * `event.url` is the *resolved* URL — exactly what `cps-telemetry`'s own
   * doc comment on `route` warns against passing directly: it wants a
   * template (`/customers/:id`), not `/customers/john@example.com`, so that
   * `route` stays one metric dimension per route rather than splitting into
   * one series per resolved value. This app's own routes are all static (see
   * `app-routing.module.ts` — no `:id`-style segments anywhere), so a
   * resolved URL and its template only ever differ by the query string,
   * fragment, and any matrix parameters (`;key=value`) a link happened to
   * carry; stripping those is enough here. Matrix parameters are legal on
   * any segment of a static route too, not just parameterized ones, so they
   * are stripped per-segment rather than assumed absent.
   */
  private routeTemplate(url: string): string {
    return url
      .split(/[?#]/)[0]
      .split('/')
      .map((segment) => segment.split(';')[0])
      .join('/');
  }

  /**
   * Consumes the pending navigation-intent timestamp, if one is fresh enough.
   *
   * A stale mark — the user clicked a link, then navigated by some other route
   * entirely — would backdate an unrelated journey, so anything older than the
   * window is discarded.
   *
   * @returns the click timestamp, or `undefined` to measure from now
   */
  private navigationStartedAt(): number | undefined {
    const at = this.navigationIntentAt;
    this.navigationIntentAt = undefined;

    if (at === undefined || Date.now() - at > INTENT_MAX_AGE_MS) {
      return undefined;
    }
    return at;
  }

  private consumePendingRedirectScenario(): CpsScenario | undefined {
    const scenario = this.pendingRedirectScenario;
    this.pendingRedirectScenario = undefined;
    return scenario;
  }

  private settle(
    navigationId: number,
    apply: (scenario: CpsScenario) => void
  ): void {
    const scenario = this.navigations.get(navigationId);
    if (!scenario) {
      return;
    }
    this.navigations.delete(navigationId);
    apply(scenario);
  }
}
