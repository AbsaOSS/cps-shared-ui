import { Injectable } from '@angular/core';
import { CpsTelemetrySink } from '../cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Sink that discards everything.
 *
 * Selected with `provideCpsTelemetrySink('noop')` — never a default. Debug
 * flags, logging and scenario mechanics all still work, with no AWS account
 * or `aws-rum-web` dependency needed.
 *
 * @group Services
 */
@Injectable()
export class CpsNoopTelemetrySink extends CpsTelemetrySink {
  /** @inheritdoc */
  record(): void {}

  /** @inheritdoc */
  recordError(): void {}

  /** @inheritdoc */
  getSessionId(): string | undefined {
    return undefined;
  }

  /** @inheritdoc */
  setUserId(): void {}

  /** @inheritdoc */
  getUserId(): string | undefined {
    return undefined;
  }

  /** @inheritdoc */
  flush(): void {}
}
