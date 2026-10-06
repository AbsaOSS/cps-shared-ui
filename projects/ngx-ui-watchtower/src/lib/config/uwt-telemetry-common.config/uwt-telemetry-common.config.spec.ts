import { UWT_DEFAULT_BI_TELEMETRY_CONFIG } from '../uwt-bi-telemetry.config/uwt-bi-telemetry.config';
import { UWT_DEFAULT_LOG_CONFIG } from '../uwt-log.config/uwt-log.config';
import { UWT_DEFAULT_SCENARIO_TELEMETRY_CONFIG } from '../uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import { UWT_DEFAULT_TELEMETRY_CONFIG } from './uwt-telemetry-common.config';

describe('UWT_DEFAULT_TELEMETRY_CONFIG', () => {
  it('should default the event namespace to com.uwt', () => {
    expect(UWT_DEFAULT_TELEMETRY_CONFIG.eventNamespace).toBe('com.uwt');
  });

  it("should compose each concern's own default", () => {
    expect(UWT_DEFAULT_TELEMETRY_CONFIG.scenario).toBe(
      UWT_DEFAULT_SCENARIO_TELEMETRY_CONFIG
    );
    expect(UWT_DEFAULT_TELEMETRY_CONFIG.logs).toBe(UWT_DEFAULT_LOG_CONFIG);
    expect(UWT_DEFAULT_TELEMETRY_CONFIG.bi).toBe(
      UWT_DEFAULT_BI_TELEMETRY_CONFIG
    );
  });
});
