import { CpsNoopTelemetrySink } from './cps-noop-telemetry.sink';
import { CpsTelemetrySink } from '../cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

describe('CpsNoopTelemetrySink', () => {
  let sink: CpsTelemetrySink;

  beforeEach(() => {
    sink = new CpsNoopTelemetrySink();
  });

  it('should discard record() without throwing', () => {
    expect(() => sink.record('com.cps.bi', { x: 1 })).not.toThrow();
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

  it('should report no user id, even after setUserId()', () => {
    sink.setUserId('user-1');
    expect(sink.getUserId()).toBeUndefined();
  });

  it('should discard flush() without throwing', () => {
    expect(() => sink.flush(true)).not.toThrow();
  });

  it('should accept the full sink API when typed as the concrete class itself, not just through CpsTelemetrySink', () => {
    const concrete = new CpsNoopTelemetrySink();
    expect(() => {
      concrete.record('com.cps.bi', { x: 1 }, { a: 1 });
      concrete.recordError({ name: 'Error', message: 'boom' }, { a: 1 });
      concrete.setUserId('user-1');
      concrete.flush(true);
    }).not.toThrow();
  });
});
