import {
  classifyHostname,
  resolveDeploymentEnvironment
} from './deployment-environment';

describe('classifyHostname', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', '0.0.0.0'])(
    "should resolve '%s' to development",
    (hostname) => {
      expect(classifyHostname(hostname)).toBe('development');
    }
  );

  it.each(['app.example.com', 'staging.example.com', '203.0.113.5'])(
    "should resolve '%s' to production",
    (hostname) => {
      expect(classifyHostname(hostname)).toBe('production');
    }
  );

  it('should default to production with no hostname at all', () => {
    expect(classifyHostname(undefined)).toBe('production');
  });
});

describe('resolveDeploymentEnvironment', () => {
  it('should read the real window.location.hostname', () => {
    expect(resolveDeploymentEnvironment()).toBe('development');
  });
});
