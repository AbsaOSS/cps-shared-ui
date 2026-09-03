import { CPS_DEFAULT_TELEMETRY_CONFIG } from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CpsScenarioRecord } from '../../models/cps-scenario.models/cps-scenario.models';
import { CpsTelemetryMetadata } from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { CPS_DEFAULT_REDACT_CONFIG } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CpsScenario, CpsScenarioDeps } from './cps-scenario';

/** Captures what the scenario emitted, so a test can assert on it. */
class RecordingSink extends CpsTelemetrySink {
  readonly events: { eventType: string; payload: Record<string, unknown> }[] =
    [];

  sessionId: string | undefined = 'test-session';
  userId: string | undefined;

  record(eventType: string, payload: object): void {
    this.events.push({
      eventType,
      payload: payload as Record<string, unknown>
    });
  }

  recordError(): void {}

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  flush(): void {}
}

function createDeps(overrides: Partial<CpsScenarioDeps> = {}): {
  deps: CpsScenarioDeps;
  sink: RecordingSink;
  settled: CpsScenarioRecord[];
} {
  const sink = new RecordingSink();
  const settled: CpsScenarioRecord[] = [];
  const deps: CpsScenarioDeps = {
    identity: {
      application: 'test-app',
      environment: 'test',
      version: '1.0.0'
    },
    scenarioConfig: { ...CPS_DEFAULT_TELEMETRY_CONFIG.scenario },
    redact: CPS_DEFAULT_REDACT_CONFIG,
    sink,
    onSettled: (_id, record) => settled.push(record),
    ...overrides
  };
  return { deps, sink, settled };
}

describe('CpsScenario (direct construction)', () => {
  describe('construction', () => {
    it('should construct from a plain CpsScenarioDeps object, with no Angular DI involved', () => {
      const { deps } = createDeps();
      expect(() => new CpsScenario({ name: 'checkout' }, deps)).not.toThrow();
    });

    it('should assign a unique id to every instance', () => {
      const { deps } = createDeps();
      const a = new CpsScenario({ name: 'checkout' }, deps);
      const b = new CpsScenario({ name: 'checkout' }, deps);
      expect(a.id).not.toBe(b.id);
    });

    it('should expose the name it was started with', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);
      expect(scenario.name).toBe('checkout');
    });

    it('should report no status and isSettled=false before settling', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);
      expect(scenario.status).toBeUndefined();
      expect(scenario.isSettled).toBe(false);
    });
  });

  describe('steps', () => {
    it('should record a scenario-start boundary even with no steps taken', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      const record = scenario.toRecord();

      expect(record.steps).toHaveLength(1);
      expect(record.steps[0]).toMatchObject({
        name: 'scenario-start',
        status: 'success'
      });
    });

    it('should close the previous step when the next one opens', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.step('fetch');
      scenario.step('render');

      const fetchStep = scenario
        .toRecord()
        .steps.find((s) => s.name === 'fetch');
      expect(fetchStep?.status).toBe('success');
    });

    it('should mark a step failed via failStep without settling the scenario', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.step('fetch');
      scenario.failStep(new Error('network down'));

      expect(scenario.isSettled).toBe(false);
      const fetchStep = scenario
        .toRecord()
        .steps.find((s) => s.name === 'fetch');
      expect(fetchStep?.status).toBe('failure');
      expect(fetchStep?.error).toMatchObject({ message: 'network down' });
    });

    it('should ignore mutation calls once settled', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete();

      expect(() => scenario.step('too-late')).not.toThrow();
      expect(scenario.toRecord().stepCount).toBe(0);
    });

    it("should not let a mutated mid-flight toRecord() snapshot change what's later emitted", () => {
      const { deps, sink } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.step('fetch', { count: 1 });
      scenario.setData({ owner: 'checkout-team' });

      const snapshot = scenario.toRecord();
      const fetchStep = snapshot.steps.find((s) => s.name === 'fetch');
      (fetchStep!.metadata as CpsTelemetryMetadata).count = 999;
      (snapshot.metadata as CpsTelemetryMetadata).owner = 'hijacked';

      scenario.complete();

      const emitted = sink.events[0].payload as unknown as CpsScenarioRecord;
      const emittedFetchStep = emitted.steps.find((s) => s.name === 'fetch');
      expect(emittedFetchStep?.metadata?.count).toBe(1);
      expect(emitted.metadata?.owner).toBe('checkout-team');
    });
  });

  describe('settle', () => {
    it('should emit exactly one scenario event to the sink', () => {
      const { deps, sink } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete();

      expect(sink.events).toHaveLength(1);
      expect(sink.events[0].eventType).toBe('com.cps.scenario');
    });

    it('should notify onSettled with the final record', () => {
      const { deps, settled } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete({ message: 'done' });

      expect(settled).toHaveLength(1);
      expect(settled[0].status).toBe('success');
      expect(settled[0].message).toBe('done');
    });

    it('should keep message and reason independent, never merged', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete({ message: 'human note', reason: 'cache-hit' });

      const record = scenario.toRecord();
      expect(record.message).toBe('human note');
      expect(record.reason).toBe('cache-hit');
    });

    it('should ignore a second settle call after the first', () => {
      const { deps, settled } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete();
      scenario.fail({ error: new Error('too late') });

      expect(settled).toHaveLength(1);
      expect(scenario.status).toBe('success');
    });

    it('should attach the normalized error to the root record even for a non-failure status', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.settle('success', {}, new Error('odd but allowed'));

      const record = scenario.toRecord();
      expect(record.status).toBe('success');
      expect(record.error).toMatchObject({ message: 'odd but allowed' });

      const scenarioEndStep = record.steps.find(
        (s) => s.name === 'scenario-end'
      );
      expect(scenarioEndStep?.error).toBeUndefined();
    });

    it('should retain a legitimately falsy thrown value, not treat it as no error', () => {
      const { deps } = createDeps();
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.fail({ error: 0 });

      const record = scenario.toRecord();
      expect(record.error).toBeDefined();
      expect(record.error).toMatchObject({ name: 'number' });
    });
  });

  describe('CpsScenarioDeps contract', () => {
    it('should read identity from the supplied deps, not a default', () => {
      const { deps } = createDeps({
        identity: {
          application: 'custom-app',
          environment: 'qa',
          version: '9.9.9'
        }
      });
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      expect(scenario.toRecord().application).toBe('custom-app');
    });

    it("should call onSettled exactly once, with this scenario's own id", () => {
      const calls: string[] = [];
      const { deps } = createDeps({ onSettled: (id) => calls.push(id) });
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      scenario.complete();

      expect(calls).toEqual([scenario.id]);
    });

    it('should read the session and user id from the supplied sink', () => {
      const { deps, sink } = createDeps();
      sink.sessionId = 's-1';
      sink.userId = 'u-1';
      const scenario = new CpsScenario({ name: 'checkout' }, deps);

      const record = scenario.toRecord();
      expect(record.sessionId).toBe('s-1');
      expect(record.userId).toBe('u-1');
    });

    it('should redact metadata using the supplied redact config, not the library default', () => {
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const { deps } = createDeps({
        redact: { ...CPS_DEFAULT_REDACT_CONFIG, maxKeys: 1 }
      });
      const scenario = new CpsScenario(
        { name: 'checkout', metadata: { a: 1, b: 2 } as CpsTelemetryMetadata },
        deps
      );

      expect(Object.keys(scenario.toRecord().metadata ?? {})).toHaveLength(1);

      consoleWarn.mockRestore();
    });
  });
});
