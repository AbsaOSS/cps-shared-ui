import { TestBed } from '@angular/core/testing';
import { AppRumCredentialsProvider } from './rum-credentials.provider';

/** A well-formed `/rum/init` broker response. */
function initResponse(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    config: {
      applicationId: 'app-monitor-1',
      region: 'eu-west-1',
      sessionSampleRate: 0.5,
      applicationVersion: '3.0.0'
    },
    credentials: {
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: 'token',
      expiration: '2030-01-01T00:00:00.000Z'
    },
    ...overrides
  };
}

function mockFetch(status: number, body: unknown): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body)
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('AppRumCredentialsProvider', () => {
  let provider: AppRumCredentialsProvider;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    TestBed.configureTestingModule({});
    provider = TestBed.inject(AppRumCredentialsProvider);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should request /rum/init, asking for a JSON response and bypassing the HTTP cache', async () => {
    const fetchMock = mockFetch(200, initResponse());

    await provider.load();

    expect(fetchMock).toHaveBeenCalledWith('/rum/init', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
  });

  it('should map a well-formed response onto CpsRumBootstrap field-for-field', async () => {
    mockFetch(200, initResponse());

    const bootstrap = await provider.load();

    expect(bootstrap).toEqual({
      config: {
        applicationId: 'app-monitor-1',
        region: 'eu-west-1',
        applicationVersion: '3.0.0',
        sessionSampleRate: 0.5
      },
      credentials: {
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret',
        sessionToken: 'token',
        expiration: '2030-01-01T00:00:00.000Z'
      }
    });
  });

  it('should return null when the broker responds with a non-ok status', async () => {
    mockFetch(500, {});

    expect(await provider.load()).toBeNull();
  });

  it('should return null when RUM is switched off for this deployment', async () => {
    mockFetch(200, initResponse({ enabled: false }));

    expect(await provider.load()).toBeNull();
  });

  it('should return null when config is missing even though enabled is true', async () => {
    mockFetch(200, initResponse({ config: undefined }));

    expect(await provider.load()).toBeNull();
  });

  it('should return null when credentials are missing, not start an unauthenticated client', async () => {
    mockFetch(200, initResponse({ credentials: undefined }));

    expect(await provider.load()).toBeNull();
  });

  it('should return null, not reject, when fetch itself fails at the network level', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(
        new TypeError('Failed to fetch')
      ) as unknown as typeof fetch;

    await expect(provider.load()).resolves.toBeNull();
  });
});
