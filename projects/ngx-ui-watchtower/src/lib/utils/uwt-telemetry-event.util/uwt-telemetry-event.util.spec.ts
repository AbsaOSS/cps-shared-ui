import { uwtEventTypes } from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { uwtClassifyTelemetryEvent } from './uwt-telemetry-event.util';

describe('uwtClassifyTelemetryEvent', () => {
  const payload = { any: 'thing' };

  it.each([
    ['com.uwt.scenario', 'scenario'],
    ['com.uwt.scenario.step', 'scenario-step'],
    ['com.uwt.bi', 'bi']
  ])('should classify %s as %s', (eventType, kind) => {
    expect(uwtClassifyTelemetryEvent(eventType, payload)).toEqual({
      kind,
      payload
    });
  });

  it("should classify any realm's namespace the same way", () => {
    const types = uwtEventTypes('com.my-app');
    expect(uwtClassifyTelemetryEvent(types.scenario, payload).kind).toBe(
      'scenario'
    );
    expect(uwtClassifyTelemetryEvent(types.scenarioStep, payload).kind).toBe(
      'scenario-step'
    );
    expect(uwtClassifyTelemetryEvent(types.bi, payload).kind).toBe('bi');
  });

  it.each(['com.my-app.click', 'com.uwt.scenarios', 'scenario', ''])(
    'should leave %p unknown',
    (eventType) => {
      expect(uwtClassifyTelemetryEvent(eventType, payload)).toEqual({
        kind: 'unknown',
        payload
      });
    }
  );

  it('should hand back the very payload it was given', () => {
    expect(uwtClassifyTelemetryEvent('com.uwt.bi', payload).payload).toBe(
      payload
    );
  });
});
