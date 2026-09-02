import { defer, EMPTY, of, throwError } from 'rxjs';
import { CpsScenario } from '../cps-scenario/cps-scenario';
import { traceScenario } from './cps-scenario-operators';

describe('traceScenario operator', () => {
  let scenario: jest.Mocked<CpsScenario>;

  beforeEach(() => {
    scenario = {
      complete: jest.fn(),
      fail: jest.fn()
    } as unknown as jest.Mocked<CpsScenario>;
  });

  it('should complete scenario on successful stream completion', (done) => {
    of(['user1', 'user2'])
      .pipe(traceScenario(scenario))
      .subscribe({
        next: (val) => {
          expect(val).toEqual(['user1', 'user2']);
        },
        complete: () => {
          expect(scenario.complete).toHaveBeenCalledWith(undefined);
          expect(scenario.fail).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should complete scenario with mapped outcome using function argument', (done) => {
    of(['item1', 'item2', 'item3'])
      .pipe(
        traceScenario(scenario, (items) => ({
          metadata: { itemCount: items.length }
        }))
      )
      .subscribe({
        complete: () => {
          expect(scenario.complete).toHaveBeenCalledWith({
            metadata: { itemCount: 3 }
          });
          done();
        }
      });
  });

  it('should complete scenario with mapped outcome using options object', (done) => {
    of({ status: 200, data: 'ok' })
      .pipe(
        traceScenario(scenario, {
          outcome: (res) => ({
            statusCode: res.status,
            metadata: { result: res.data }
          })
        })
      )
      .subscribe({
        complete: () => {
          expect(scenario.complete).toHaveBeenCalledWith({
            statusCode: 200,
            metadata: { result: 'ok' }
          });
          done();
        }
      });
  });

  it('should complete scenario with no outcome when the stream completes with no emissions', (done) => {
    EMPTY.pipe(
      traceScenario(scenario, () => ({ metadata: { unreachable: true } }))
    ).subscribe({
      complete: () => {
        expect(scenario.complete).toHaveBeenCalledWith(undefined);
        expect(scenario.fail).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should fail scenario when the stream errors and re-throw the error', (done) => {
    const error = new Error('network down');
    throwError(() => error)
      .pipe(traceScenario(scenario))
      .subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(scenario.fail).toHaveBeenCalledWith({ error });
          expect(scenario.complete).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should still settle the scenario when the outcome mapper throws', (done) => {
    of('value')
      .pipe(
        traceScenario(scenario, () => {
          throw new Error('mapper is broken');
        })
      )
      .subscribe({
        complete: () => {
          expect(scenario.complete).toHaveBeenCalledWith(undefined);
          expect(scenario.fail).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should not leak lastValue/hasValue into a resubscription of the same piped observable', (done) => {
    let subscriptionCount = 0;
    const source = defer(() => {
      subscriptionCount++;
      return subscriptionCount === 1 ? of('a') : EMPTY;
    });

    const traced$ = source.pipe(
      traceScenario(scenario, (value) => ({ metadata: { value } }))
    );

    traced$.subscribe({
      complete: () => {
        expect(scenario.complete).toHaveBeenNthCalledWith(1, {
          metadata: { value: 'a' }
        });

        traced$.subscribe({
          complete: () => {
            expect(scenario.complete).toHaveBeenNthCalledWith(2, undefined);
            done();
          }
        });
      }
    });
  });
});
