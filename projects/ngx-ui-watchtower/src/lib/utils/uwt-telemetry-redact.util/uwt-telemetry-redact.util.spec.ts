import {
  UWT_DEFAULT_REDACT_CONFIG,
  UWT_REDACTED,
  uwtMergeMetadata,
  uwtNormalizeError,
  uwtRedactConfigFor,
  uwtRedactMetadata,
  uwtScrubString
} from './uwt-telemetry-redact.util';

describe('uwtScrubString', () => {
  it('should strip the query string and fragment from an absolute URL', () => {
    expect(
      uwtScrubString(
        'https://api.example.com/customers?token=abc123#section',
        UWT_DEFAULT_REDACT_CONFIG
      )
    ).toBe('https://api.example.com/customers');
  });

  it('should strip a URL embedded inside a longer message', () => {
    expect(
      uwtScrubString(
        'Request to https://api.example.com/v1/users?apiKey=secret failed',
        UWT_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Request to https://api.example.com/v1/users failed');
  });

  it('should strip the query string from a root-relative path', () => {
    expect(
      uwtScrubString('/customers?ssn=123-45-6789', UWT_DEFAULT_REDACT_CONFIG)
    ).toBe('/customers');
  });

  it('should strip a root-relative path embedded inside a longer message', () => {
    expect(
      uwtScrubString(
        'Request to /api/customers/search?email=john@example.com&ssn=123-45-6789 failed',
        UWT_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Request to /api/customers/search failed');
  });

  it('should strip more than one embedded root-relative path in the same string', () => {
    expect(
      uwtScrubString(
        'compare /a/x?p=1 against /b/y?q=2 now',
        UWT_DEFAULT_REDACT_CONFIG
      )
    ).toBe('compare /a/x against /b/y now');
  });

  it('should strip a root-relative path with no space before it', () => {
    expect(
      uwtScrubString(
        'Redirected to:/dashboard?sessionToken=abc123',
        UWT_DEFAULT_REDACT_CONFIG
      )
    ).toBe('Redirected to:/dashboard');
  });

  it('should leave a plain message that merely ends in a question mark intact', () => {
    expect(
      uwtScrubString('Could not load the data?', UWT_DEFAULT_REDACT_CONFIG)
    ).toBe('Could not load the data?');
  });

  it('should truncate strings beyond the configured cap', () => {
    const result = uwtScrubString('x'.repeat(50), {
      ...UWT_DEFAULT_REDACT_CONFIG,
      maxStringLength: 10
    });
    expect(result).toBe(`${'x'.repeat(10)}…`);
  });

  it('should leave URLs alone when stripping is disabled', () => {
    expect(
      uwtScrubString('https://example.com/a?b=c', {
        ...UWT_DEFAULT_REDACT_CONFIG,
        stripUrlQuery: false
      })
    ).toBe('https://example.com/a?b=c');
  });

  describe('value-pattern scanning', () => {
    it('should not scan for any value pattern by default', () => {
      expect(
        uwtScrubString(
          'contact john.smith@example.com, card 4111111111111111, ssn 123-45-6789',
          UWT_DEFAULT_REDACT_CONFIG
        )
      ).toBe(
        'contact john.smith@example.com, card 4111111111111111, ssn 123-45-6789'
      );
    });

    it('should redact an email address when enabled', () => {
      expect(
        uwtScrubString('contact john.smith@example.com for help', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe(`contact ${UWT_REDACTED} for help`);
    });

    it('should not match a bare @-handle with no domain as an email', () => {
      expect(
        uwtScrubString('cc @someuser on this', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe('cc @someuser on this');
    });

    it('should catch an email embedded in a URL path segment', () => {
      expect(
        uwtScrubString('/customers/john.smith@example.com', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email']
        })
      ).toBe(`/customers/${UWT_REDACTED}`);
    });

    it('should redact a Luhn-valid credit card number when enabled', () => {
      expect(
        uwtScrubString('card on file: 4111111111111111', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard']
        })
      ).toBe(`card on file: ${UWT_REDACTED}`);
    });

    it('should leave a 16-digit run alone when it fails the Luhn checksum', () => {
      expect(
        uwtScrubString('order number: 1234567890123456', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard']
        })
      ).toBe('order number: 1234567890123456');
    });

    it('should redact a well-formatted SSN when enabled', () => {
      expect(
        uwtScrubString('ssn on file: 123-45-6789', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ssn']
        })
      ).toBe(`ssn on file: ${UWT_REDACTED}`);
    });

    it('should not match a bare 9-digit run with no dashes as an SSN', () => {
      expect(
        uwtScrubString('reference 123456789', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ssn']
        })
      ).toBe('reference 123456789');
    });

    it('should redact an IPv4 address when enabled', () => {
      expect(
        uwtScrubString('client at 192.168.1.1', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ipv4']
        })
      ).toBe(`client at ${UWT_REDACTED}`);
    });

    it('should not match an out-of-range octet as an IPv4 address', () => {
      expect(
        uwtScrubString('version 999.999.999.999', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['ipv4']
        })
      ).toBe('version 999.999.999.999');
    });

    it('should redact a US-shaped phone number when enabled', () => {
      expect(
        uwtScrubString('call (555) 123-4567', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone']
        })
      ).toBe(`call ${UWT_REDACTED}`);
    });

    it('should redact a South African phone number in international format when enabled', () => {
      expect(
        uwtScrubString('call +27 82 123 4567', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone']
        })
      ).toBe(`call ${UWT_REDACTED}`);
    });

    it('should redact a value matching an application-supplied pattern', () => {
      expect(
        uwtScrubString('internal ref ACC-98765', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          extraValuePatterns: [/ACC-\d+/]
        })
      ).toBe(`internal ref ${UWT_REDACTED}`);
    });

    it('should redact every occurrence even when the supplied pattern has no g flag', () => {
      expect(
        uwtScrubString('ref ACC-111 and also ref ACC-222', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          extraValuePatterns: [/ACC-\d+/]
        })
      ).toBe(`ref ${UWT_REDACTED} and also ref ${UWT_REDACTED}`);
    });

    it('should redact correctly across repeated calls reusing the same non-global pattern object', () => {
      const pattern = /ACC-\d+/;
      const config = {
        ...UWT_DEFAULT_REDACT_CONFIG,
        extraValuePatterns: [pattern]
      };

      expect(uwtScrubString('ref ACC-111 and also ACC-222', config)).toBe(
        `ref ${UWT_REDACTED} and also ${UWT_REDACTED}`
      );

      expect(uwtScrubString('ref ACC-333 and also ACC-444', config)).toBe(
        `ref ${UWT_REDACTED} and also ${UWT_REDACTED}`
      );
    });

    it('should not recompile the same non-global pattern into a new RegExp on every call', () => {
      const RegExpSpy = jest.spyOn(globalThis, 'RegExp');
      const pattern = /ACC-\d+/;
      const config = {
        ...UWT_DEFAULT_REDACT_CONFIG,
        extraValuePatterns: [pattern]
      };

      uwtScrubString('ref ACC-111', config);
      const callsAfterFirst = RegExpSpy.mock.calls.length;
      uwtScrubString('ref ACC-222', config);
      const callsAfterSecond = RegExpSpy.mock.calls.length;

      expect(callsAfterFirst).toBeGreaterThan(0);
      expect(callsAfterSecond).toBe(callsAfterFirst);

      RegExpSpy.mockRestore();
    });

    it('should fully redact a credit card number regardless of scanValuePatterns order', () => {
      const value = 'card on file: 4111111111111111';
      expect(
        uwtScrubString(value, {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['phone', 'creditCard']
        })
      ).toBe(`card on file: ${UWT_REDACTED}`);
      expect(
        uwtScrubString(value, {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['creditCard', 'phone']
        })
      ).toBe(`card on file: ${UWT_REDACTED}`);
    });

    it('should apply multiple enabled patterns to the same string', () => {
      expect(
        uwtScrubString('email a@b.com or call (555) 123-4567', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          scanValuePatterns: ['email', 'phone']
        })
      ).toBe(`email ${UWT_REDACTED} or call ${UWT_REDACTED}`);
    });
  });

  describe('extraValueTransforms', () => {
    it('should run a custom transform on every string value', () => {
      expect(
        uwtScrubString('internal-id ACC-12345', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          extraValueTransforms: [
            (value) => value.replace(/ACC-\d+/, UWT_REDACTED)
          ]
        })
      ).toBe(`internal-id ${UWT_REDACTED}`);
    });

    it('should run regardless of scanValuePatterns/extraValuePatterns being empty', () => {
      expect(
        uwtScrubString('plain text', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          extraValueTransforms: [() => 'replaced']
        })
      ).toBe('replaced');
    });

    it('should run multiple transforms in array order', () => {
      expect(
        uwtScrubString('start', {
          ...UWT_DEFAULT_REDACT_CONFIG,
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
          uwtScrubString('unchanged', {
            ...UWT_DEFAULT_REDACT_CONFIG,
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
          uwtScrubString('start', {
            ...UWT_DEFAULT_REDACT_CONFIG,
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
        uwtScrubString('short', {
          ...UWT_DEFAULT_REDACT_CONFIG,
          maxStringLength: 5,
          extraValueTransforms: [() => 'a much longer replacement value']
        })
      ).toBe('a muc…');
    });
  });
});

describe('uwtRedactMetadata', () => {
  it('should keep primitive values', () => {
    expect(
      uwtRedactMetadata({ count: 3, name: 'csv', ok: true, empty: null })
    ).toEqual({
      count: 3,
      name: 'csv',
      ok: true,
      empty: null
    });
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
    expect(uwtRedactMetadata({ [key]: 'super-secret-value' })).toEqual({
      [key]: UWT_REDACTED
    });
  });

  it('should redact keys matching an application-supplied pattern', () => {
    expect(
      uwtRedactMetadata(
        { customerRef: 'ABC' },
        { ...UWT_DEFAULT_REDACT_CONFIG, extraKeyPatterns: [/customerRef/i] }
      )
    ).toEqual({ customerRef: UWT_REDACTED });
  });

  it('should redact the same key consistently across repeated calls with a global pattern', () => {
    const config = {
      ...UWT_DEFAULT_REDACT_CONFIG,
      extraKeyPatterns: [/internalId/gi]
    };
    for (let i = 0; i < 4; i++) {
      expect(uwtRedactMetadata({ internalId: 'value' }, config)).toEqual({
        internalId: UWT_REDACTED
      });
    }
  });

  it('should drop nested objects rather than serializing them', () => {
    expect(
      uwtRedactMetadata({ user: { id: 1, email: 'a@b.c' }, safe: 'yes' })
    ).toEqual({ safe: 'yes' });
  });

  it('should drop arrays, functions, symbols and undefined', () => {
    expect(
      uwtRedactMetadata({
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
      uwtRedactMetadata({ a: NaN, b: Infinity, c: -Infinity, d: 0 })
    ).toEqual({ d: 0 });
  });

  it('should scrub URLs inside string values', () => {
    expect(uwtRedactMetadata({ url: 'https://x.dev/p?token=1' })).toEqual({
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
    const result = uwtRedactMetadata(input, {
      ...UWT_DEFAULT_REDACT_CONFIG,
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
      uwtRedactMetadata(
        { a: 1, b: 2, c: 3 },
        { ...UWT_DEFAULT_REDACT_CONFIG, maxKeys: 2 }
      );

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('maxKeys')
      );
    });

    it('should stay silent when every key fits under maxKeys', () => {
      uwtRedactMetadata(
        { a: 1, b: 2 },
        { ...UWT_DEFAULT_REDACT_CONFIG, maxKeys: 2 }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  it('should not throw on a cyclic object', () => {
    const cyclic: Record<string, unknown> = { name: 'root' };
    cyclic.self = cyclic;
    expect(uwtRedactMetadata(cyclic)).toEqual({ name: 'root' });
  });

  it.each([[null], [undefined], ['string'], [42], [[1, 2]]])(
    'should return undefined for the non-object input %p',
    (input) => {
      expect(uwtRedactMetadata(input)).toBeUndefined();
    }
  );

  it('should return undefined when nothing survives redaction', () => {
    expect(uwtRedactMetadata({ nested: { a: 1 } })).toBeUndefined();
  });
});

describe('uwtMergeMetadata', () => {
  it('should return target unchanged when incoming is undefined', () => {
    const target = { a: 1 };
    expect(uwtMergeMetadata(target, undefined)).toBe(target);
    expect(target).toEqual({ a: 1 });
  });

  it('should merge a disjoint bag in when under maxKeys', () => {
    const target = { a: 1 };
    const result = uwtMergeMetadata(
      target,
      { b: 2 },
      {
        ...UWT_DEFAULT_REDACT_CONFIG,
        maxKeys: 5
      }
    );
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should drop a genuinely new key once the combined count reaches maxKeys', () => {
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const target = { a: 1 };
    try {
      const result = uwtMergeMetadata(
        target,
        { b: 2 },
        {
          ...UWT_DEFAULT_REDACT_CONFIG,
          maxKeys: 1
        }
      );
      expect(result).toEqual({ a: 1 });
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('maxKeys')
      );
    } finally {
      consoleWarn.mockRestore();
    }
  });

  it('should allow updating a key already present even when target is at maxKeys', () => {
    const target = { a: 1 };
    const result = uwtMergeMetadata(
      target,
      { a: 2 },
      {
        ...UWT_DEFAULT_REDACT_CONFIG,
        maxKeys: 1
      }
    );
    expect(result).toEqual({ a: 2 });
  });

  it('should mutate and return the same target reference', () => {
    const target = { a: 1 };
    expect(uwtMergeMetadata(target, { b: 2 })).toBe(target);
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
      uwtMergeMetadata(
        { a: 1 },
        { b: 2 },
        {
          ...UWT_DEFAULT_REDACT_CONFIG,
          maxKeys: 1
        }
      );

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('maxKeys')
      );
    });

    it('should stay silent when the combined bag fits under maxKeys', () => {
      uwtMergeMetadata(
        { a: 1 },
        { b: 2 },
        {
          ...UWT_DEFAULT_REDACT_CONFIG,
          maxKeys: 2
        }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });

    it('should stay silent when only existing keys are updated at maxKeys', () => {
      uwtMergeMetadata(
        { a: 1 },
        { a: 2 },
        {
          ...UWT_DEFAULT_REDACT_CONFIG,
          maxKeys: 1
        }
      );

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});

describe('uwtNormalizeError', () => {
  it('should reduce an Error to name, message and stack', () => {
    const result = uwtNormalizeError(new TypeError('boom'));
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
    expect(uwtNormalizeError(error)?.name).toBe('Error');
  });

  it('should omit the stack when capture is disabled', () => {
    const result = uwtNormalizeError(new Error('boom'), {
      ...UWT_DEFAULT_REDACT_CONFIG,
      includeStack: false
    });
    expect(result?.stack).toBeUndefined();
  });

  it('should cap the stack length', () => {
    const error = new Error('boom');
    error.stack = 'y'.repeat(5000);
    const result = uwtNormalizeError(error, {
      ...UWT_DEFAULT_REDACT_CONFIG,
      maxStackLength: 100
    });
    expect(result?.stack?.length).toBe(101);
  });

  it('should scrub URLs out of the error message', () => {
    const result = uwtNormalizeError(
      new Error('GET https://api.dev/me?access_token=xyz returned 401')
    );
    expect(result?.message).toBe('GET https://api.dev/me returned 401');
  });

  it('should accept a thrown string', () => {
    expect(uwtNormalizeError('plain failure')).toEqual({
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

    const result = uwtNormalizeError(httpError);

    expect(result).toEqual({
      name: 'HttpErrorResponse',
      message: 'Http failure response for /api/customers: 404 Not Found'
    });
    expect(JSON.stringify(result)).not.toContain('raw response body');
  });

  it('should fall back to a generic name when the HTTP-error-shaped object has none', () => {
    const result = uwtNormalizeError({
      message: 'Http failure response for /api/x: 500 Internal Server Error',
      status: 500,
      statusText: 'Internal Server Error'
    });

    expect(result?.name).toBe('HttpErrorResponse');
  });

  it('should not treat an arbitrary object with a status-shaped key as an HTTP error', () => {
    expect(
      uwtNormalizeError({ status: 404, message: 'unrelated object' })
    ).toEqual({
      name: 'UnknownError',
      message: UWT_REDACTED
    });
  });

  it('should report the type of a thrown object without serializing it', () => {
    expect(uwtNormalizeError({ password: 'hunter2' })).toEqual({
      name: 'UnknownError',
      message: UWT_REDACTED
    });
  });

  it.each([[null], [undefined]])('should return undefined for %p', (input) => {
    expect(uwtNormalizeError(input)).toBeUndefined();
  });
});

describe('uwtRedactConfigFor', () => {
  it('should return the same config unchanged when enabled', () => {
    expect(uwtRedactConfigFor(UWT_DEFAULT_REDACT_CONFIG, true)).toBe(
      UWT_DEFAULT_REDACT_CONFIG
    );
  });

  it('should turn off PII scrubbing when disabled', () => {
    const config = uwtRedactConfigFor(
      {
        ...UWT_DEFAULT_REDACT_CONFIG,
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
    const config = uwtRedactConfigFor(
      {
        ...UWT_DEFAULT_REDACT_CONFIG,
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
    const disabled = uwtRedactConfigFor(UWT_DEFAULT_REDACT_CONFIG, false);

    expect(uwtRedactMetadata({ password: 'hunter2' }, disabled)).toEqual({
      password: UWT_REDACTED
    });
  });

  it('should not redact an extraKeyPatterns-only key when disabled', () => {
    const disabled = uwtRedactConfigFor(
      { ...UWT_DEFAULT_REDACT_CONFIG, extraKeyPatterns: [/x-internal/] },
      false
    );

    expect(uwtRedactMetadata({ 'x-internal-id': 'abc' }, disabled)).toEqual({
      'x-internal-id': 'abc'
    });
  });
});
