import { CPS_DEFAULT_BI_TELEMETRY_CONFIG } from './cps-bi-telemetry.config';

describe('CPS_DEFAULT_BI_TELEMETRY_CONFIG', () => {
  it('should default the dedup window and key cap', () => {
    expect(CPS_DEFAULT_BI_TELEMETRY_CONFIG).toEqual({
      dedupWindowMs: 400,
      dedupMaxKeys: 100,
      redact: true
    });
  });
});
