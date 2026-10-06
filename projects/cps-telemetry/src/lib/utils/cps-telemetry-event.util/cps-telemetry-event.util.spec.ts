import { cpsEventTypes } from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { cpsClassifyTelemetryEvent } from './cps-telemetry-event.util';

describe('cpsClassifyTelemetryEvent', () => {
  const payload = { any: 'thing' };

  it.each([
    ['com.cps.scenario', 'scenario'],
    ['com.cps.scenario.step', 'scenario-step'],
    ['com.cps.bi', 'bi']
  ])('should classify %s as %s', (eventType, kind) => {
    expect(cpsClassifyTelemetryEvent(eventType, payload)).toEqual({
      kind,
      payload
    });
  });

  it("should classify any realm's namespace the same way", () => {
    const types = cpsEventTypes('com.my-app');
    expect(cpsClassifyTelemetryEvent(types.scenario, payload).kind).toBe(
      'scenario'
    );
    expect(cpsClassifyTelemetryEvent(types.scenarioStep, payload).kind).toBe(
      'scenario-step'
    );
    expect(cpsClassifyTelemetryEvent(types.bi, payload).kind).toBe('bi');
  });

  it.each(['com.my-app.click', 'com.cps.scenarios', 'scenario', ''])(
    'should leave %p unknown',
    (eventType) => {
      expect(cpsClassifyTelemetryEvent(eventType, payload)).toEqual({
        kind: 'unknown',
        payload
      });
    }
  );

  it('should hand back the very payload it was given', () => {
    expect(cpsClassifyTelemetryEvent('com.cps.bi', payload).payload).toBe(
      payload
    );
  });
});
