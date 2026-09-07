import {
  CPS_DEFAULT_EVENT_NAMESPACE,
  CPS_TELEMETRY_EVENT_TYPE,
  cpsEventTypes
} from './cps-telemetry-common.models';

describe('cpsEventTypes', () => {
  it('should derive the three types from the default namespace', () => {
    expect(cpsEventTypes()).toEqual({
      scenario: 'com.cps.scenario',
      scenarioStep: 'com.cps.scenario.step',
      bi: 'com.cps.bi'
    });
  });

  it('should let an application keep its own namespace', () => {
    expect(cpsEventTypes('com.test-app')).toEqual({
      scenario: 'com.test-app.scenario',
      scenarioStep: 'com.test-app.scenario.step',
      bi: 'com.test-app.bi'
    });
  });

  it.each([[''], [undefined]])(
    'should fall back to the default namespace for %p',
    (value) => {
      expect(cpsEventTypes(value).bi).toBe(`${CPS_DEFAULT_EVENT_NAMESPACE}.bi`);
    }
  );

  it('should expose the default namespace as a constant', () => {
    expect(CPS_TELEMETRY_EVENT_TYPE).toEqual(
      cpsEventTypes(CPS_DEFAULT_EVENT_NAMESPACE)
    );
  });
});
