import {
  UWT_DEFAULT_EVENT_NAMESPACE,
  UWT_TELEMETRY_EVENT_TYPE,
  uwtEventTypes
} from './uwt-telemetry-common.models';

describe('uwtEventTypes', () => {
  it('should derive the three types from the default namespace', () => {
    expect(uwtEventTypes()).toEqual({
      scenario: 'com.uwt.scenario',
      scenarioStep: 'com.uwt.scenario.step',
      bi: 'com.uwt.bi'
    });
  });

  it('should let an application keep its own namespace', () => {
    expect(uwtEventTypes('com.test-app')).toEqual({
      scenario: 'com.test-app.scenario',
      scenarioStep: 'com.test-app.scenario.step',
      bi: 'com.test-app.bi'
    });
  });

  it.each([[''], [undefined]])(
    'should fall back to the default namespace for %p',
    (value) => {
      expect(uwtEventTypes(value).bi).toBe(`${UWT_DEFAULT_EVENT_NAMESPACE}.bi`);
    }
  );

  it('should expose the default namespace as a constant', () => {
    expect(UWT_TELEMETRY_EVENT_TYPE).toEqual(
      uwtEventTypes(UWT_DEFAULT_EVENT_NAMESPACE)
    );
  });
});
