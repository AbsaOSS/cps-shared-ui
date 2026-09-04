import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { cpsIsDevMode } from '../cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';

/**
 * Named, built-in value-content PII shapes {@link CpsRedactConfig.scanValuePatterns}
 * can enable.
 *
 * @group Types
 */
export type CpsPiiValuePattern =
  'email' | 'creditCard' | 'ssn' | 'ipv4' | 'phone';

/**
 * Tunables governing what telemetry is allowed to carry off the device.
 *
 * @group Interfaces
 */
export interface CpsRedactConfig {
  /**
   * Additional key patterns to redact, merged with the built-in denylist.
   * Matched against the attribute key, case-insensitively.
   */
  extraKeyPatterns: RegExp[];

  /** Maximum length of any single string value before truncation. */
  maxStringLength: number;

  /** Maximum number of attributes retained on one payload. */
  maxKeys: number;

  /** Maximum length of a captured stack trace. */
  maxStackLength: number;

  /** Whether stack traces are captured at all. */
  includeStack: boolean;

  /** Whether URL query strings and fragments are stripped from string values. */
  stripUrlQuery: boolean;

  /**
   * Value-content PII shapes to scan for, in addition to the key denylist.
   * Off by default. Heuristic regexes, not certified detectors — `'phone'`
   * is the noisiest; `'creditCard'` also requires a Luhn match.
   */
  scanValuePatterns: CpsPiiValuePattern[];

  /**
   * Additional value-content regexes, merged with `scanValuePatterns` — the
   * content counterpart to `extraKeyPatterns`.
   */
  extraValuePatterns: RegExp[];

  /**
   * Application-supplied functions run on every string value, after all
   * pattern-based scrubbing — an escape hatch for logic no regex can
   * express. Runs independently of `scanValuePatterns`/`extraValuePatterns`.
   * A throwing function is skipped (logged in dev mode), not fatal.
   */
  extraValueTransforms: Array<(value: string) => string>;
}

/** Keys whose values never leave the browser, matched case-insensitively (`Authorization`, `access_token`, `apiKey`, …). */
const DENYLIST =
  /pass(word|wd)?|secret|token|auth|credential|cookie|api[-_]?key|bearer|jwt|signature|session[-_]?key|ssn/i;

/** Absolute http(s) URLs appearing anywhere inside a string. */
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

/**
 * A root-relative path with a query string or fragment. The lookbehind
 * rejects a `/` that's mid-word (so this doesn't re-match inside an
 * already-scrubbed URL) without requiring whitespace before the path —
 * punctuation like `:` counts as a boundary too.
 */
const PATH_WITH_QUERY = /(?<![\w/])\/[^\s?#]*[?#][^\s]*/g;

/** The redaction placeholder written in place of a denylisted value. */
export const CPS_REDACTED = '[redacted]';

/**
 * Built-in value-content patterns for {@link CpsRedactConfig.scanValuePatterns},
 * minus `'creditCard'`, which needs a Luhn checksum per match and is handled
 * separately by {@link scrubCreditCards}.
 */
const VALUE_PATTERNS: Record<
  Exclude<CpsPiiValuePattern, 'creditCard'>,
  RegExp
> = {
  // Common email shape, not full RFC 5322.
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Matches only the dashed `123-45-6789` format; a bare 9-digit run isn't
  // reliably an SSN.
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  // NANP (US/Canada): 3-3-4 digits, optional `1`/`+1` country code,
  // South Africa (27), Botswana (267), Ghana (233), Kenya
  // (254), Mauritius (230), Mozambique (258), Namibia (264), Seychelles
  // (248), Tanzania (255), Uganda (256), Zambia (260).
  phone:
    /(?:(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(?:\+|00)(?:27|267|233|254|230|258|264|248|255|256|260)(?:[-.\s]?\d){7,9})\b/g
};

/**
 * Fixed order for {@link CpsRedactConfig.scanValuePatterns}, independent of
 * the consumer's array order. `creditCard` must run before `phone`: phone
 * has no leading `\b` and can match a trailing substring of a card number,
 * fragmenting and leaking part of it if it ran first.
 */
const VALUE_PATTERN_ORDER: CpsPiiValuePattern[] = [
  'email',
  'creditCard',
  'ssn',
  'ipv4',
  'phone'
];

/** Candidate digit runs, allowing the separators people actually type. */
const CREDIT_CARD_CANDIDATE = /\b(?:\d[ -]?){13,19}\b/g;

/** The standard Luhn checksum — tells a real card number from an unrelated digit run of the same length. */
function isLuhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48; // '0'
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }

  return digits.length > 0 && sum % 10 === 0;
}

/** Redacts credit-card-shaped digit runs that also pass a Luhn checksum. */
function scrubCreditCards(value: string): string {
  return value.replace(CREDIT_CARD_CANDIDATE, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19 && isLuhnValid(digits)
      ? CPS_REDACTED
      : match;
  });
}

/** Ensures a pattern has the `g` flag, so `.replace()` catches every occurrence, not just the first. */
function ensureGlobal(pattern: RegExp): RegExp {
  return pattern.global
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);
}

/**
 * Default redaction settings. Conservative; widen as needed.
 *
 * @group Utils
 */
export const CPS_DEFAULT_REDACT_CONFIG: CpsRedactConfig = {
  extraKeyPatterns: [],
  maxStringLength: 1024,
  maxKeys: 50,
  maxStackLength: 2048,
  includeStack: true,
  stripUrlQuery: true,
  scanValuePatterns: [],
  extraValuePatterns: [],
  extraValueTransforms: []
};

/**
 * Effective redact config for a concern's own `redact: boolean` toggle
 * (`CpsLogConfig.redact`, `CpsScenarioConfig.redact`, `CpsBiConfig.redact`).
 * Disabling it skips only the configurable scrubbing — the built-in
 * credential denylist, size caps, error normalization and
 * `extraValueTransforms` stay on regardless. See DESIGN.md §10, "Turning
 * redaction off per concern", for why.
 *
 * @param config the concern's resolved `CPS_REDACT_CONFIG`
 * @param enabled the concern's own `redact` setting
 * @returns `config` unchanged when enabled, otherwise with configurable
 *   scrubbing turned off
 *
 * @group Utils
 */
export function cpsRedactConfigFor(
  config: CpsRedactConfig,
  enabled: boolean
): CpsRedactConfig {
  if (enabled) {
    return config;
  }

  return {
    ...config,
    extraKeyPatterns: [],
    stripUrlQuery: false,
    scanValuePatterns: [],
    extraValuePatterns: []
  };
}

function isDenied(key: string, config: CpsRedactConfig): boolean {
  if (DENYLIST.test(key)) {
    return true;
  }
  return config.extraKeyPatterns.some((pattern) => {
    // A global/sticky pattern is stateful: .test() advances lastIndex, so
    // reset it to avoid alternating matches across calls.
    pattern.lastIndex = 0;
    return pattern.test(key);
  });
}

/** Reduces a URL to `origin + pathname` — tokens and identifiers tend to live in the query/fragment being dropped. */
function scrubUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    const cut = url.search(/[?#]/);
    return cut === -1 ? url : url.slice(0, cut);
  }
}

/**
 * Strips URL query strings/fragments, scans for opted-in PII shapes, runs
 * `extraValueTransforms`, then caps length — in that order, so value
 * scanning also catches PII embedded in a URL path segment.
 *
 * @param value the string to clean
 * @param config redaction settings
 * @returns the cleaned, length-capped string
 *
 * @group Utils
 */
export function cpsScrubString(value: string, config: CpsRedactConfig): string {
  let result = value;

  if (config.stripUrlQuery) {
    result = result.replace(URL_PATTERN, (match) => scrubUrl(match));
    result = result.replace(PATH_WITH_QUERY, (match) => scrubUrl(match));
  }

  if (config.scanValuePatterns.length || config.extraValuePatterns.length) {
    for (const name of VALUE_PATTERN_ORDER) {
      if (!config.scanValuePatterns.includes(name)) {
        continue;
      }
      result =
        name === 'creditCard'
          ? scrubCreditCards(result)
          : result.replace(VALUE_PATTERNS[name], CPS_REDACTED);
    }
    for (const pattern of config.extraValuePatterns) {
      result = result.replace(ensureGlobal(pattern), CPS_REDACTED);
    }
  }

  for (const transform of config.extraValueTransforms) {
    try {
      result = transform(result);
    } catch (error) {
      if (cpsIsDevMode()) {
        // eslint-disable-next-line no-console
        console.warn(
          '[cps-telemetry] An extraValueTransforms function threw and was skipped',
          error
        );
      }
    }
  }

  if (result.length > config.maxStringLength) {
    result = `${result.slice(0, config.maxStringLength)}…`;
  }

  return result;
}

/**
 * Produces a telemetry-safe attribute bag: flat primitives only (enforcing
 * at runtime what {@link CpsTelemetryMetadata} states at compile time),
 * denylisted keys redacted, strings scrubbed via {@link cpsScrubString},
 * non-finite numbers and objects/functions/symbols dropped, and the
 * attribute count capped (warns once via `console.warn` in dev mode).
 *
 * @param value the candidate attributes
 * @param config redaction settings
 * @returns a safe attribute bag, or `undefined` when nothing survives
 *
 * @group Utils
 */
export function cpsRedactMetadata(
  value: unknown,
  config: CpsRedactConfig = CPS_DEFAULT_REDACT_CONFIG
): CpsTelemetryMetadata | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const result: CpsTelemetryMetadata = {};
  let kept = 0;
  let truncated = false;

  for (const [key, raw] of Object.entries(value)) {
    if (kept >= config.maxKeys) {
      truncated = true;
      break;
    }

    if (isDenied(key, config)) {
      result[key] = CPS_REDACTED;
      kept++;
      continue;
    }

    if (raw === null || typeof raw === 'boolean') {
      result[key] = raw;
      kept++;
    } else if (typeof raw === 'number') {
      if (Number.isFinite(raw)) {
        result[key] = raw;
        kept++;
      }
    } else if (typeof raw === 'string') {
      result[key] = cpsScrubString(raw, config);
      kept++;
    }
  }

  if (truncated && cpsIsDevMode()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[cps-telemetry] Metadata exceeded maxKeys (${config.maxKeys}) and was truncated. Attributes past the limit were dropped silently in production.`
    );
  }

  return kept > 0 ? result : undefined;
}

/**
 * Merges an already-redacted attribute bag into an existing one,
 * re-applying `maxKeys` to the *combined* result. `cpsRedactMetadata` only
 * bounds the bag passed to it in isolation — merging two independently
 * capped bags without this can exceed the configured limit. A key already
 * present in `target` is always updated (a replacement, not growth); only
 * a genuinely new key counts against the cap, and is dropped once it's
 * reached (warns once in dev mode, mirroring `cpsRedactMetadata`).
 *
 * Mutates and returns `target`.
 *
 * @param target the accumulator merged into, and returned
 * @param incoming the bag being merged in, normally the output of {@link cpsRedactMetadata}
 * @param config redaction settings
 * @returns `target`, with `incoming` merged in
 *
 * @group Utils
 */
export function cpsMergeMetadata(
  target: CpsTelemetryMetadata,
  incoming: CpsTelemetryMetadata | undefined,
  config: CpsRedactConfig = CPS_DEFAULT_REDACT_CONFIG
): CpsTelemetryMetadata {
  if (!incoming) {
    return target;
  }

  let keyCount = Object.keys(target).length;
  let truncated = false;

  for (const [key, value] of Object.entries(incoming)) {
    const isNewKey = !(key in target);
    if (isNewKey && keyCount >= config.maxKeys) {
      truncated = true;
      continue;
    }
    if (isNewKey) {
      keyCount++;
    }
    target[key] = value;
  }

  if (truncated && cpsIsDevMode()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[cps-telemetry] Combined metadata exceeded maxKeys (${config.maxKeys}) and was truncated. Attributes past the limit were dropped silently in production.`
    );
  }

  return target;
}

/**
 * Converts a thrown value into a bounded, telemetry-safe shape — only the
 * constructor name, scrubbed message and (optionally) a capped stack; never
 * the raw error object.
 *
 * @param error any thrown value, including non-`Error` values
 * @param config redaction settings
 * @returns the normalized error, or `undefined` when there is nothing to report
 *
 * @group Utils
 */
export function cpsNormalizeError(
  error: unknown,
  config: CpsRedactConfig = CPS_DEFAULT_REDACT_CONFIG
): CpsTelemetryError | undefined {
  if (error === null || error === undefined) {
    return undefined;
  }

  if (error instanceof Error) {
    const normalized: CpsTelemetryError = {
      name: error.name || 'Error',
      message: cpsScrubString(error.message ?? '', config)
    };

    if (config.includeStack && typeof error.stack === 'string') {
      normalized.stack = cpsScrubString(error.stack, {
        ...config,
        maxStringLength: config.maxStackLength
      });
    }

    return normalized;
  }

  if (typeof error === 'string') {
    return { name: 'Error', message: cpsScrubString(error, config) };
  }

  if (isHttpErrorShaped(error)) {
    // HttpErrorResponse doesn't extend Error, so instanceof above misses it.
    return {
      name: typeof error.name === 'string' ? error.name : 'HttpErrorResponse',
      message: cpsScrubString(error.message, config)
    };
  }

  return {
    name: typeof error === 'object' ? 'UnknownError' : typeof error,
    message: CPS_REDACTED
  };
}

/** Duck-types an `HttpErrorResponse`-shaped object, avoiding an `@angular/common/http` import (and its runtime) just for this check. */
function isHttpErrorShaped(
  error: unknown
): error is { name?: unknown; message: string; status: number } {
  if (error === null || typeof error !== 'object') {
    return false;
  }
  const candidate = error as Record<string, unknown>;
  return (
    typeof candidate.message === 'string' &&
    typeof candidate.status === 'number' &&
    ('statusText' in candidate || 'url' in candidate)
  );
}
