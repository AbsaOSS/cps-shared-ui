import { CPS_DEFAULT_LOG_CONFIG } from './cps-log.config';

describe('CPS_DEFAULT_LOG_CONFIG', () => {
  it('should keep RUM error mirroring off by default', () => {
    expect(CPS_DEFAULT_LOG_CONFIG.mirrorErrorsToRum).toBe(false);
  });

  it('should default the minimum level to log', () => {
    expect(CPS_DEFAULT_LOG_CONFIG.minLevel).toBe('log');
  });

  it('should keep redaction on by default', () => {
    expect(CPS_DEFAULT_LOG_CONFIG.redact).toBe(true);
  });
});
