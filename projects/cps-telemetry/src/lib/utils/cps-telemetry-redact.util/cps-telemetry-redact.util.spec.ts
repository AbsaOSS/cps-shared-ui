import {
  CPS_DEFAULT_REDACT_CONFIG,
  CPS_REDACTED,
  cpsMergeMetadata,
  cpsNormalizeError,
  cpsRedactConfigFor,
  cpsRedactMetadata,
  cpsScrubString
} from './cps-telemetry-redact.util';

describe('cpsScrubString', () => {
  it('should strip the query string and fragment from an absolute URL', () => {
    expect(
      cpsScrubString(
        'https://api.example.com/customers?token=abc123#section',
        CPS_DEFAULT_REDACT_CONFIG
      )
    ).toBe('https://api.example.com/customers');
  });

  it('should strip a URL embedded inside a longer message', () => {
    expect(
      cpsScrubString(
        'Request to https://api.example.com/v1/users?apiKey=secret failed',
        CPS_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Request to https://api.example.com/v1/users failed');
  });

  it('should strip the query string from a root-relative path', () => {
    expect(
      cpsScrubString('/customers?ssn=123-45-6789', CPS_DEFAULT_REDACT_CONFIG)
    ).toBe('/customers');
  });

  it('should strip a root-relative path embedded inside a longer message', () => {
    expect(
      cpsScrubString(
        'Request to /api/customers/search?email=john@example.com&ssn=123-45-6789 failed',
        CPS_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Request to /api/customers/search failed');
  });

  it('should strip more than one embedded root-relative path in the same string', () => {
    expect(
      cpsScrubString(
        'compare /a/x?p=1 against /b/y?q=2 now',
        CPS_DEFAULT_REDACT_CONFIG
      )
    ).toBe('compare /a/x against /b/y now');
  });

  it('should strip a root-relative path with no space before it', () => {
    expect(
      cpsScrubString(
        'Redirected to:/dashboard?sessionToken=abc123',
        CPS_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Redirected to:/dashboard');
  });

  it('should leave a plain message that merely ends in a question mark intact', () => {
    expect(
      cpsScrubString('Could not load the data?', CPS_DEFAULT_REDACT_CONFIG)
    ).toBe('Could not load the data?');
  });

  it('should truncate strings beyond the configured cap', () => {
    const result = cpsScrubString('x'.repeat(50), {
      ...CPS_DEFAULT_REDACT_CONFIG,
      maxStringLength: 10
    });
    expect(result).toBe(`${'x'.repeat(10)}…`);
  });

  it('should leave URLs alone when stripping is disabled', () => {
    expect(
      cpsScrubString('https://example.com/a?b=c', {
        ...CPS_DEFAULT_REDACT_CONFIG,
        stripUrlQuery: false
      })
    ).toBe('https://example.com/a?b=c');
  });

  describe('value-pattern scanning', () => {
    it('should not scan for any value pattern by default', () => {
      expect(
        cpsScrubString(
          'contact john.smith@example.com, card 4111111111111111, ssn 123-45-6789',
          CPS_DEFAULT_REDACT_CONFIG
        )
      ).toBe(
        'contact john.smith@example.com, card 4111111111111111, ssn 123-45-6789'
      );
    });

    it('should redact an email address when enabled', () => {
      expect(
        cpsScrubString('contact john.smith@example.com for help', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe(`contact ${CPS_REDACTED} for help`);
    });

    it('should not match a bare @-handle with no domain as an email', () => {
      expect(
        cpsScrubString('cc @someuser on this', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe('cc @someuser on this');
    });

    it('should catch an email embedded in a URL path segment', () => {
      expect(
        cpsScrubString('/customers/john.smith@example.com', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe(`/customers/${CPS_REDACTED}`);
    });

    it('should redact a Luhn-valid credit card number when enabled', () => {
      expect(
        cpsScrubString('card on file: 4111111111111111', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard']
        })
      ).toBe(`card on file: ${CPS_REDACTED}`);
    });

    it('should leave a 16-digit run alone when it fails the Luhn checksum', () => {
      expect(
        cpsScrubString('order number: 1234567890123456', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard']
        })
      ).toBe('order number: 1234567890123456');
    });

    it('should redact a well-formatted SSN when enabled', () => {
      expect(
        cpsScrubString('ssn on file: 123-45-6789', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ssn']
        })
      ).toBe(`ssn on file: ${CPS_REDACTED}`);
    });

    it('should not match a bare 9-digit run with no dashes as an SSN', () => {
      expect(
        cpsScrubString('reference 123456789', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ssn']
        })
      ).toBe('reference 123456789');
    });

    it('should redact an IPv4 address when enabled', () => {
      expect(
        cpsScrubString('client at 192.168.1.1', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ipv4']
        })
      ).toBe(`client at ${CPS_REDACTED}`);
    });

    it('should not match an out-of-range octet as an IPv4 address', () => {
      expect(
        cpsScrubString('version 999.999.999.999', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ipv4']
        })
      ).toBe('version 999.999.999.999');
    });

    it('should redact a US-shaped phone number when enabled', () => {
      expect(
        cpsScrubString('call (555) 123-4567', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone']
        })
      ).toBe(`call ${CPS_REDACTED}`);
    });

    it('should redact a South African phone number in international format when enabled', () => {
      expect(
        cpsScrubString('call +27 82 123 4567', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone']
        })
      ).toBe(`call ${CPS_REDACTED}`);
    });

    it('should redact a value matching an application-supplied pattern', () => {
      expect(
        cpsScrubString('internal ref ACC-98765', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          extraValuePatterns: [/ACC-\d+/]
        })
      ).toBe(`internal ref ${CPS_REDACTED}`);
    });

    it('should redact every occurrence even when the supplied pattern has no g flag', () => {
      expect(
        cpsScrubString('ref ACC-111 and also ref ACC-222', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          extraValuePatterns: [/ACC-\d+/]
        })
      ).toBe(`ref ${CPS_REDACTED} and also ref ${CPS_REDACTED}`);
    });

    it('should redact correctly across repeated calls reusing the same non-global pattern object', () => {
      const pattern = /ACC-\d+/;
      const config = {
        ...CPS_DEFAULT_REDACT_CONFIG,
        extraValuePatterns: [pattern]
      };

      expect(cpsScrubString('ref ACC-111 and also ACC-222', config)).toBe(
        `ref ${CPS_REDACTED} and also ${CPS_REDACTED}`
      );

      expect(cpsScrubString('ref ACC-333 and also ACC-444', config)).toBe(
        `ref ${CPS_REDACTED} and also ${CPS_REDACTED}`
      );
    });

    it('should not recompile the same non-global pattern into a new RegExp on every call', () => {
      const RegExpSpy = jest.spyOn(globalThis, 'RegExp');
      const pattern = /ACC-\d+/;
      const config = {
        ...CPS_DEFAULT_REDACT_CONFIG,
        extraValuePatterns: [pattern]
      };

      cpsScrubString('ref ACC-111', config);
      const callsAfterFirst = RegExpSpy.mock.calls.length;
      cpsScrubString('ref ACC-222', config);
      const callsAfterSecond = RegExpSpy.mock.calls.length;

      expect(callsAfterFirst).toBeGreaterThan(0);
      expect(callsAfterSecond).toBe(callsAfterFirst);

      RegExpSpy.mockRestore();
    });

    it('should fully redact a credit card number regardless of scanValuePatterns order', () => {
      const value = 'card on file: 4111111111111111';
      expect(
        cpsScrubString(value, {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone', 'creditCard']
        })
      ).toBe(`card on file: ${CPS_REDACTED}`);
      expect(
        cpsScrubString(value, {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard', 'phone']
        })
      ).toBe(`card on file: ${CPS_REDACTED}`);
    });

    it('should apply multiple enabled patterns to the same string', () => {
      expect(
        cpsScrubString('email a@b.com or call (555) 123-4567', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email', 'phone']
        })
      ).toBe(`email ${CPS_REDACTED} or call ${CPS_REDACTED}`);
    });
  });

  describe('extraValueTransforms', () => {
    it('should run a custom transform on every string value', () => {
      expect(
        cpsScrubString('internal-id ACC-12345', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          extraValueTransforms: [
            (value) => value.replace(/ACC-\d+/, CPS_REDACTED)
          ]
        })
      ).toBe(`internal-id ${CPS_REDACTED}`);
    });

    it('should run regardless of scanValuePatterns/extraValuePatterns being empty', () => {
      expect(
        cpsScrubString('plain text', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          extraValueTransforms: [() => 'replaced']
        })
      ).toBe('replaced');
    });

    it('should run multiple transforms in array order', () => {
      expect(
        cpsScrubString('start', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          extraValueTransforms: [
            (value) => `${value}-a`,
            (value) => `${value}-b`
          ]
        })
      ).toBe('start-a-b');
    });

    describe('a throwing transform', () => {
      let consoleWarn: jest.SpyInstance;

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarn.mockRestore();
      });

      it('should skip it and keep the value from before it, reporting why', () => {
        expect(
          cpsScrubString('unchanged', {
            ...CPS_DEFAULT_REDACT_CONFIG,
            extraValueTransforms: [
              () => {
                throw new Error('broken transform');
              }
            ]
          })
        ).toBe('unchanged');
        expect(consoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('extraValueTransforms'),
          expect.any(Error)
        );
      });

      it('should still apply subsequent transforms after it', () => {
        expect(
          cpsScrubString('start', {
            ...CPS_DEFAULT_REDACT_CONFIG,
            extraValueTransforms: [
              () => {
                throw new Error('broken transform');
              },
              (value) => `${value}-ok`
            ]
          })
        ).toBe('start-ok');
        expect(consoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('extraValueTransforms'),
          expect.any(Error)
        );
      });
    });

    it('should still cap length after custom transforms run', () => {
      expect(
        cpsScrubString('short', {
          ...CPS_DEFAULT_REDACT_CONFIG,
          maxStringLength: 5,
          extraValueTransforms: [() => 'a much longer replacement value']
        })
      ).toBe('a muc…');
    });
  });
});

describe('cpsRedactMetadata', () => {
  it('should keep primitive values', () => {
    expect(
      cpsRedactMetadata({ count: 3, name: 'csv', ok: true, empty: null })
    ).toEqual({ count: 3, name: 'csv', ok: true, empty: null });
  });

  it.each([
    'password',
    'passwd',
    'accessToken',
    'refresh_token',
    'Authorization',
    'clientSecret',
    'apiKey',
    'api_key',
    'Cookie',
    'bearerToken',
    'jwt',
    'signature',
    'sessionKey',
    'ssn'
  ])('should redact the sensitive key "%s"', (key) => {
    expect(cpsRedactMetadata({ [key]: 'super-secret-value' })).toEqual({
      [key]: CPS_REDACTED
    });
  });

  it('should redact keys matching an application-supplied pattern', () => {
    expect(
      cpsRedactMetadata(
        { customerRef: 'ABC' },
        { ...CPS_DEFAULT_REDACT_CONFIG, extraKeyPatterns: [/customerRef/i] }
      )
    ).toEqual({ customerRef: CPS_REDACTED });
  });

  it('should redact the same key consistently across repeated calls with a global pattern', () => {
    const config = {
      ...CPS_DEFAULT_REDACT_CONFIG,
      extraKeyPatterns: [/internalId/gi]
    };
    for (let i = 0; i < 4; i++) {
      expect(cpsRedactMetadata({ internalId: 'value' }, config)).toEqual({
        internalId: CPS_REDACTED
      });
    }
  });

  it('should drop nested objects rather than serializing them', () => {
    expect(
      cpsRedactMetadata({ user: { id: 1, email: 'a@b.c' }, safe: 'yes' })
    ).toEqual({ safe: 'yes' });
  });

  it('should drop arrays, functions, symbols and undefined', () => {
    expect(
      cpsRedactMetadata({
        rows: [1, 2, 3],
        fn: () => undefined,
        sym: Symbol('s'),
        missing: undefined,
        kept: 1
      })
    ).toEqual({ kept: 1 });
  });

  it('should drop non-finite numbers', () => {
    expect(
      cpsRedactMetadata({ a: NaN, b: Infinity, c: -Infinity, d: 0 })
    ).toEqual({ d: 0 });
  });

  it('should scrub URLs inside string values', () => {
    expect(cpsRedactMetadata({ url: 'https://x.dev/p?token=1' })).toEqual({
      url: 'https://x.dev/p'
    });
  });

  it('should cap the number of retained keys', () => {
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const input: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      input[`k${i}`] = i;
    }
    const result = cpsRedactMetadata(input, {
      ...CPS_DEFAULT_REDACT_CONFIG,
      maxKeys: 5
    });
    expect(Object.keys(result ?? {})).toHaveLength(5);

    consoleWarn.mockRestore();
  });

  describe('truncation warning', () => {
    let consoleWarn: jest.SpyInstance;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('should warn once when maxKeys actually truncates something', () => {
      cpsRedactMetadata(
        { a: 1, b: 2, c: 3 },
        { ...CPS_DEFAULT_REDACT_CONFIG, maxKeys: 2 }
      );

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('maxKeys')
      );
    });

    it('should stay silent when every key fits under maxKeys', () => {
      cpsRedactMetadata(
        { a: 1, b: 2 },
        { ...CPS_DEFAULT_REDACT_CONFIG, maxKeys: 2 }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  it('should not throw on a cyclic object', () => {
    const cyclic: Record<string, unknown> = { name: 'root' };
    cyclic.self = cyclic;
    expect(cpsRedactMetadata(cyclic)).toEqual({ name: 'root' });
  });

  it.each([[null], [undefined], ['string'], [42], [[1, 2]]])(
    'should return undefined for the non-object input %p',
    (input) => {
      expect(cpsRedactMetadata(input)).toBeUndefined();
    }
  );

  it('should return undefined when nothing survives redaction', () => {
    expect(cpsRedactMetadata({ nested: { a: 1 } })).toBeUndefined();
  });
});

describe('cpsMergeMetadata', () => {
  it('should return target unchanged when incoming is undefined', () => {
    const target = { a: 1 };
    expect(cpsMergeMetadata(target, undefined)).toBe(target);
    expect(target).toEqual({ a: 1 });
  });

  it('should merge a disjoint bag in when under maxKeys', () => {
    const target = { a: 1 };
    const result = cpsMergeMetadata(
      target,
      { b: 2 },
      {
        ...CPS_DEFAULT_REDACT_CONFIG,
        maxKeys: 5
      }
    );
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should drop a genuinely new key once the combined count reaches maxKeys', () => {
    const target = { a: 1 };
    const result = cpsMergeMetadata(
      target,
      { b: 2 },
      {
        ...CPS_DEFAULT_REDACT_CONFIG,
        maxKeys: 1
      }
    );
    expect(result).toEqual({ a: 1 });
  });

  it('should allow updating a key already present even when target is at maxKeys', () => {
    const target = { a: 1 };
    const result = cpsMergeMetadata(
      target,
      { a: 2 },
      {
        ...CPS_DEFAULT_REDACT_CONFIG,
        maxKeys: 1
      }
    );
    expect(result).toEqual({ a: 2 });
  });

  it('should mutate and return the same target reference', () => {
    const target = { a: 1 };
    expect(cpsMergeMetadata(target, { b: 2 })).toBe(target);
  });

  describe('truncation warning', () => {
    let consoleWarn: jest.SpyInstance;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('should warn once when maxKeys actually truncates the combined result', () => {
      cpsMergeMetadata(
        { a: 1 },
        { b: 2 },
        {
          ...CPS_DEFAULT_REDACT_CONFIG,
          maxKeys: 1
        }
      );

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('maxKeys')
      );
    });

    it('should stay silent when the combined bag fits under maxKeys', () => {
      cpsMergeMetadata(
        { a: 1 },
        { b: 2 },
        {
          ...CPS_DEFAULT_REDACT_CONFIG,
          maxKeys: 2
        }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });

    it('should stay silent when only existing keys are updated at maxKeys', () => {
      cpsMergeMetadata(
        { a: 1 },
        { a: 2 },
        {
          ...CPS_DEFAULT_REDACT_CONFIG,
          maxKeys: 1
        }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});

describe('cpsNormalizeError', () => {
  it('should reduce an Error to name, message and stack', () => {
    const result = cpsNormalizeError(new TypeError('boom'));
    expect(result?.name).toBe('TypeError');
    expect(result?.message).toBe('boom');
    expect(typeof result?.stack).toBe('string');
  });

  it.each([
    ['empty', ''],
    ['missing', undefined]
  ])('should fall back to the generic label when name is %s', (_case, name) => {
    const error = new Error('boom');
    (error as { name: unknown }).name = name;
    expect(cpsNormalizeError(error)?.name).toBe('Error');
  });

  it('should omit the stack when capture is disabled', () => {
    const result = cpsNormalizeError(new Error('boom'), {
      ...CPS_DEFAULT_REDACT_CONFIG,
      includeStack: false
    });
    expect(result?.stack).toBeUndefined();
  });

  it('should cap the stack length', () => {
    const error = new Error('boom');
    error.stack = 'y'.repeat(5000);
    const result = cpsNormalizeError(error, {
      ...CPS_DEFAULT_REDACT_CONFIG,
      maxStackLength: 100
    });
    expect(result?.stack?.length).toBe(101);
  });

  it('should scrub URLs out of the error message', () => {
    const result = cpsNormalizeError(
      new Error('GET https://api.dev/me?access_token=xyz returned 401')
    );
    expect(result?.message).toBe('GET https://api.dev/me returned 401');
  });

  it('should accept a thrown string', () => {
    expect(cpsNormalizeError('plain failure')).toEqual({
      name: 'Error',
      message: 'plain failure'
    });
  });

  it('should extract name and message from an HttpErrorResponse-shaped object', () => {
    const httpError = {
      name: 'HttpErrorResponse',
      message: 'Http failure response for /api/customers: 404 Not Found',
      status: 404,
      statusText: 'Not Found',
      url: '/api/customers',
      ok: false,
      error: { secret: 'raw response body — must never appear in output' }
    };

    const result = cpsNormalizeError(httpError);

    expect(result).toEqual({
      name: 'HttpErrorResponse',
      message: 'Http failure response for /api/customers: 404 Not Found'
    });
    expect(JSON.stringify(result)).not.toContain('raw response body');
  });

  it('should fall back to a generic name when the HTTP-error-shaped object has none', () => {
    const result = cpsNormalizeError({
      message: 'Http failure response for /api/x: 500 Internal Server Error',
      status: 500,
      statusText: 'Internal Server Error'
    });

    expect(result?.name).toBe('HttpErrorResponse');
  });

  it('should not treat an arbitrary object with a status-shaped key as an HTTP error', () => {
    expect(
      cpsNormalizeError({ status: 404, message: 'unrelated object' })
    ).toEqual({ name: 'UnknownError', message: CPS_REDACTED });
  });

  it('should report the type of a thrown object without serializing it', () => {
    expect(cpsNormalizeError({ password: 'hunter2' })).toEqual({
      name: 'UnknownError',
      message: CPS_REDACTED
    });
  });

  it.each([[null], [undefined]])('should return undefined for %p', (input) => {
    expect(cpsNormalizeError(input)).toBeUndefined();
  });
});

describe('cpsRedactConfigFor', () => {
  it('should return the same config unchanged when enabled', () => {
    expect(cpsRedactConfigFor(CPS_DEFAULT_REDACT_CONFIG, true)).toBe(
      CPS_DEFAULT_REDACT_CONFIG
    );
  });

  it('should turn off PII scrubbing when disabled', () => {
    const config = cpsRedactConfigFor(
      {
        ...CPS_DEFAULT_REDACT_CONFIG,
        extraKeyPatterns: [/x-internal/],
        scanValuePatterns: ['email'],
        extraValuePatterns: [/secret-\d+/]
      },
      false
    );

    expect(config.extraKeyPatterns).toEqual([]);
    expect(config.stripUrlQuery).toBe(false);
    expect(config.scanValuePatterns).toEqual([]);
    expect(config.extraValuePatterns).toEqual([]);
  });

  it('should keep size caps, error normalization inputs, and extraValueTransforms when disabled', () => {
    const transform = (value: string) => value;
    const config = cpsRedactConfigFor(
      {
        ...CPS_DEFAULT_REDACT_CONFIG,
        maxStringLength: 10,
        maxKeys: 5,
        maxStackLength: 100,
        includeStack: true,
        extraValueTransforms: [transform]
      },
      false
    );

    expect(config.maxStringLength).toBe(10);
    expect(config.maxKeys).toBe(5);
    expect(config.maxStackLength).toBe(100);
    expect(config.includeStack).toBe(true);
    expect(config.extraValueTransforms).toEqual([transform]);
  });

  it('should still redact a built-in denylisted key when disabled — it is a safety floor, not a privacy opt-in', () => {
    const disabled = cpsRedactConfigFor(CPS_DEFAULT_REDACT_CONFIG, false);

    expect(cpsRedactMetadata({ password: 'hunter2' }, disabled)).toEqual({
      password: CPS_REDACTED
    });
  });

  it('should not redact an extraKeyPatterns-only key when disabled', () => {
    const disabled = cpsRedactConfigFor(
      { ...CPS_DEFAULT_REDACT_CONFIG, extraKeyPatterns: [/x-internal/] },
      false
    );

    expect(cpsRedactMetadata({ 'x-internal-id': 'abc' }, disabled)).toEqual({
      'x-internal-id': 'abc'
    });
  });
});
