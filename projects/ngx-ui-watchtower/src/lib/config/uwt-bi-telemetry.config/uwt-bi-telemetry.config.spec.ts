import { UWT_DEFAULT_BI_TELEMETRY_CONFIG } from './uwt-bi-telemetry.config';

describe('UWT_DEFAULT_BI_TELEMETRY_CONFIG', () => {
  it('should default the dedup window and key cap', () => {
    expect(UWT_DEFAULT_BI_TELEMETRY_CONFIG).toEqual({
      dedupWindowMs: 400,
      dedupMaxKeys: 100,
      redact: true
    });
  });
});
