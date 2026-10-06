import { UwtNoopLogApiProvider } from './uwt-noop-log-api.provider';

describe('UwtNoopLogApiProvider', () => {
  let provider: UwtNoopLogApiProvider;

  beforeEach(() => {
    provider = new UwtNoopLogApiProvider();
  });

  it('should discard send() without throwing', () => {
    expect(() =>
      provider.send({
        timestamp: '2026-01-01T00:00:00.000Z',
        level: 'warn',
        message: 'Careful',
        application: 'shell',
        environment: 'test',
        version: '1.0.0'
      })
    ).not.toThrow();
  });

  it('should find no records', async () => {
    await expect(provider.query({ correlationId: 'c-1' })).resolves.toEqual([]);
  });
});
