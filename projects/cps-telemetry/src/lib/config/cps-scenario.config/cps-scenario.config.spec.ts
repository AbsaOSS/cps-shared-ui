import { CPS_DEFAULT_SCENARIO_CONFIG } from './cps-scenario.config';

describe('CPS_DEFAULT_SCENARIO_CONFIG', () => {
  it('should keep verbose lifecycle emission off by default', () => {
    expect(CPS_DEFAULT_SCENARIO_CONFIG.emitLifecycleEvents).toBe(false);
  });

  it('should default to a 30s timeout and a 50-step cap', () => {
    expect(CPS_DEFAULT_SCENARIO_CONFIG.defaultTimeoutMs).toBe(30_000);
    expect(CPS_DEFAULT_SCENARIO_CONFIG.maxSteps).toBe(50);
  });

  it('should keep User Timings off by default', () => {
    expect(CPS_DEFAULT_SCENARIO_CONFIG.userTimings).toBe(false);
  });

  it('should default the mark cleanup fallback to 5 minutes', () => {
    expect(CPS_DEFAULT_SCENARIO_CONFIG.markCleanupFallbackMs).toBe(300_000);
  });

  it('should keep redaction on by default', () => {
    expect(CPS_DEFAULT_SCENARIO_CONFIG.redact).toBe(true);
  });
});
