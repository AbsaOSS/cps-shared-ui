import { CPS_DEFAULT_BI_CONFIG } from './cps-bi.config';

describe('CPS_DEFAULT_BI_CONFIG', () => {
  it('should default the dedup window and key cap', () => {
    expect(CPS_DEFAULT_BI_CONFIG).toEqual({
      dedupWindowMs: 400,
      dedupMaxKeys: 100,
      redact: true
    });
  });
});
