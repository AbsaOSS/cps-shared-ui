import { UwtNoopTelemetrySink } from './uwt-noop-telemetry.sink';
import { UwtTelemetrySink } from '../uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';

describe('UwtNoopTelemetrySink', () => {
  let sink: UwtTelemetrySink;

  beforeEach(() => {
    sink = new UwtNoopTelemetrySink();
  });

  it('should discard record() without throwing', () => {
    expect(() => sink.record('com.uwt.bi', { x: 1 })).not.toThrow();
  });

  it('should discard recordError() without throwing', () => {
    expect(() =>
      sink.recordError({ name: 'Error', message: 'boom' })
    ).not.toThrow();
  });

  it('should report no session id', () => {
    expect(sink.getSessionId()).toBeUndefined();
  });

  it('should discard setUserId() without throwing', () => {
    expect(() => sink.setUserId('user-1')).not.toThrow();
  });

  it('should report the user id last given to setUserId(), even though telemetry itself is discarded', () => {
    sink.setUserId('user-1');
    expect(sink.getUserId()).toBe('user-1');
  });

  it('should report no user id again after signing out', () => {
    sink.setUserId('user-1');
    sink.setUserId(undefined);
    expect(sink.getUserId()).toBeUndefined();
  });

  it('should discard flush() without throwing', () => {
    expect(() => sink.flush(true)).not.toThrow();
  });

  it('should accept the full sink API when typed as the concrete class itself, not just through UwtTelemetrySink', () => {
    const concrete = new UwtNoopTelemetrySink();
    expect(() => {
      concrete.record('com.uwt.bi', { x: 1 }, { a: 1 });
      concrete.recordError({ name: 'Error', message: 'boom' }, { a: 1 });
      concrete.setUserId('user-1');
      concrete.flush(true);
    }).not.toThrow();
  });
});
