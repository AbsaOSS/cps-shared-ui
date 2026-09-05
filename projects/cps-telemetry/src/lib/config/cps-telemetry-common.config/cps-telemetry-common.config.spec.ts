import { CPS_DEFAULT_BI_CONFIG } from '../cps-bi.config/cps-bi.config';
import { CPS_DEFAULT_LOG_CONFIG } from '../cps-log.config/cps-log.config';
import { CPS_DEFAULT_SCENARIO_CONFIG } from '../cps-scenario.config/cps-scenario.config';
import { CPS_DEFAULT_TELEMETRY_CONFIG } from './cps-telemetry-common.config';

describe('CPS_DEFAULT_TELEMETRY_CONFIG', () => {
  it('should default the event namespace to com.cps', () => {
    expect(CPS_DEFAULT_TELEMETRY_CONFIG.eventNamespace).toBe('com.cps');
  });

  it("should compose each concern's own default", () => {
    expect(CPS_DEFAULT_TELEMETRY_CONFIG.scenario).toBe(
      CPS_DEFAULT_SCENARIO_CONFIG
    );
    expect(CPS_DEFAULT_TELEMETRY_CONFIG.logs).toBe(CPS_DEFAULT_LOG_CONFIG);
    expect(CPS_DEFAULT_TELEMETRY_CONFIG.bi).toBe(CPS_DEFAULT_BI_CONFIG);
  });
});
