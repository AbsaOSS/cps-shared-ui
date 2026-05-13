import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * Service for validating 6-field cron expressions with extended features.
 *
 * This service handles cron validation logic for extended cron expression formats
 * that support additional features beyond standard Unix cron for more flexible
 * scheduling capabilities.
 *
 * Format: minutes hours day-of-month month day-of-week year
 *
 * Key Features:
 * - Wildcards: asterisk (any value), question mark (any value for day fields)
 * - Ranges: 1-5, MON-FRI, JAN-MAR
 * - Steps: asterisk/15, 5/10, 1-5/2
 * - Lists: 1,3,5, MON,WED,FRI
 * - Special chars: L (last), W (weekday), hash (nth occurrence)
 * @see {@link https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html#cron-based | AWS EventBridge Scheduler - Cron-based schedules}
 * @group Services
 */
@Injectable({
  providedIn: 'root'
})
export class CpsCronValidationService {
  /**
   * Validates a complete 6-field cron expression.
   *
   * @param cron - The 6-field cron expression to validate
   * @param allowEmpty - Whether to allow empty cron expressions
   * @returns boolean - True if the cron expression is valid
   * @group Method
   */
  isValidCron(cron: string, allowEmpty = false): boolean {
    if (typeof cron !== 'string') return false;

    if (allowEmpty && cron === '') return true;
    if (!cron) return false;

    const parts = cron.split(' ');
    if (parts.length !== 6) {
      return false;
    }

    return this._validateCronFields(parts);
  }

  /**
   * Validates all six fields of an extended cron expression.
   *
   * Extended cron format uses 6 fields: minutes hours day-of-month month day-of-week year
   * This method validates each field according to extended cron syntax rules,
   * which build upon standard Unix cron with additional features.
   *
   * Field Ranges and Features:
   * - Minutes (0-59): Numeric, ranges, steps, lists
   * - Hours (0-23): Numeric, ranges, steps, lists
   * - Day-of-month (1-31): Numeric + special chars (L, W, LW)
   * - Month (1-12): Numeric or named (JAN-DEC), ranges, steps, lists
   * - Day-of-week (1-7): Numeric or named (SUN-SAT), special chars (L, #)
   * - Year (1970-2199): Extended range for long-term scheduling
   *
   * Key Rules:
   * - Day-of-month and day-of-week are mutually exclusive (one must be * or ?)
   * - ? is only valid for day-of-month and day-of-week fields
   * - Special characters provide advanced scheduling capabilities
   *
   * @param parts - Array of 6 cron field strings [minutes, hours, dayOfMonth, month, dayOfWeek, year]
   * @returns boolean - True if all fields are valid and follow extended cron rules
   */
  private _validateCronFields(parts: string[]): boolean {
    const [minutes, hours, dayOfMonth, month, dayOfWeek, year] = parts;

    // Validate minutes (0-59) - use enhanced validation
    if (!this._validateComplexField(minutes, 0, 59, 'minutes')) return false;

    // Validate hours (0-23) - use enhanced validation
    if (!this._validateComplexField(hours, 0, 23, 'hours')) return false;

    // Validate day of month (1-31 or wildcards)
    if (!this._validateDayOfMonth(dayOfMonth)) return false;

    // Validate month (1-12 or JAN-DEC) - use enhanced validation
    if (!this._validateMonth(month)) return false;

    // Validate day of week (1-7 or SUN-SAT) - enhanced method will handle this
    if (!this._validateDayOfWeek(dayOfWeek)) return false;

    // Validate year (1970-2199) - use enhanced validation
    if (!this._validateComplexField(year, 1970, 2199, 'year')) return false;

    // Validate mutual exclusivity of day-of-month and day-of-week
    if (!this._validateDayMutualExclusivity(dayOfMonth, dayOfWeek))
      return false;

    return true;
  }

  /**
   * Enhanced validation for complex cron field patterns.
   * Supports extended cron features including ranges, steps, lists, and special characters.
   *
   * This method handles extended cron expression syntax which builds upon
   * standard Unix cron format with additional features for flexible scheduling.
   *
   * Supported patterns:
   * - Wildcards: asterisk (any value), question mark (any value for day fields)
   * - Ranges: 1-5 (values 1 through 5), MON-FRI (Monday through Friday)
   * - Steps: asterisk/10 (every 10th value), 1-5/2 (every 2nd value from 1 to 5)
   * - Lists: 1,3,5 (specific values), MON,WED,FRI (specific days)
   * - Special chars: L (last), W (weekday), hash (nth occurrence)
   *
   * @param field - The cron field value to validate (examples: "1-5/2", "MON-FRI", "asterisk/10")
   * @param min - Minimum valid numeric value for this field type
   * @param max - Maximum valid numeric value for this field type
   * @param type - The cron field type ('minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year')
   * @returns boolean - True if the field is valid according to EventBridge Scheduler rules
   */
  private _validateComplexField(
    field: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle wildcard characters
    // '*' means "any value" and is valid for all fields
    // '?' means "no specific value" and is only valid for day-of-month and day-of-week fields
    if (field === '*' || field === '?') {
      return type === 'dayOfMonth' || type === 'dayOfWeek' || field === '*';
    }

    // Handle comma-separated lists: "1,3,5" or "MON,WED,FRI" or "MON-WED,FRI"
    // Allows scheduling on multiple specific values within a field
    if (field.includes(',')) {
      return field.split(',').every((val) => {
        const trimmedVal = val.trim();
        // Recursively validate each part of the list
        return this._validateComplexField(trimmedVal, min, max, type);
      });
    }

    // Handle complex range with step patterns: "1-5/2" (every 2nd value from 1 to 5)
    // This allows scheduling at intervals within a specific range
    if (field.includes('-') && field.includes('/')) {
      const [range, step] = field.split('/');
      const [start, end] = range.split('-');
      return this._validateRangeWithStep(start, end, step, min, max, type);
    }

    // Handle simple range patterns: "1-5" (values from 1 to 5), "MON-FRI" (Monday to Friday)
    // Extended cron supports both numeric and named ranges for time-based scheduling
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return this._validateSimpleRange(start, end, min, max, type);
    }

    // Handle step patterns from start: "5/10" (every 10th value starting from 5)
    // Extended cron uses this for interval-based scheduling from a specific starting point
    if (field.includes('/')) {
      const [start, step] = field.split('/');
      return this._validateStepField(start, step, min, max, type);
    }

    // Handle single values and special characters (L, W, #)
    // These provide advanced scheduling capabilities like "last day of month" or "3rd Tuesday"
    return this._validateSingleValue(field, min, max, type);
  }

  /**
   * Validates single values and extended cron special characters.
   *
   * This method handles the validation of individual field values including:
   * - Numeric values within specified ranges
   * - Special characters for advanced scheduling
   * - Named values like month names (JAN, FEB) and day names (SUN, MON)
   *
   * Extended Cron Special Characters:
   * - L: Last day of month (day-of-month) or last occurrence of weekday (day-of-week)
   * - W: Nearest weekday to the specified day (day-of-month only)
   * - LW: Last weekday of the month (day-of-month only)
   * - #: Nth occurrence of weekday (e.g., "3#2" = 3rd Tuesday of month)
   *
   * @param value - The single value to validate (e.g., "15", "L", "15W", "MON", "3#2")
   * @param min - Minimum valid numeric value for this field type
   * @param max - Maximum valid numeric value for this field type
   * @param type - The cron field type for context-specific validation
   * @returns boolean - True if the value is valid for EventBridge Scheduler
   */
  private _validateSingleValue(
    value: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle special characters for day of month field
    // Extended cron supports advanced day-of-month scheduling patterns
    if (type === 'dayOfMonth') {
      // 'L' = last day of month, 'LW' = last weekday of month
      if (value === 'L' || value === 'LW') return true;
      // '15W' = nearest weekday to the 15th (if 15th is weekend, use closest weekday)
      if (value.endsWith('W')) {
        const day = Number(value.slice(0, -1));
        return day >= 1 && day <= 31;
      }
    }

    // Handle special characters for day of week field
    // Extended cron supports advanced day-of-week scheduling patterns
    if (type === 'dayOfWeek') {
      // 'MONL' = last Monday of month (last occurrence)
      if (value.endsWith('L')) {
        const day = value.slice(0, -1);
        return this._isValidDayOfWeek(day);
      }
      // '3#2' = 3rd Tuesday of month (3=Tuesday, 2=second occurrence)
      if (value.includes('#')) {
        const [day, week] = value.split('#');
        return (
          this._isValidDayOfWeek(day) && Number(week) >= 1 && Number(week) <= 5
        );
      }
      // Standard day names: SUN, MON, TUE, etc.
      if (this._isValidDayOfWeek(value)) return true;
    }

    // Handle month names (JAN, FEB, MAR, etc.) for month field
    // Extended cron allows both numeric (1-12) and named month values
    if (type === 'month' && this._isValidMonthName(value)) return true;

    // Validate numeric values within the specified range
    // This covers standard numeric scheduling (minutes: 0-59, hours: 0-23, etc.)
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Validates range patterns with step intervals.
   *
   * This method handles complex range-step patterns like "1-5/2" which means
   * "every 2nd value from 1 to 5" (resulting in: 1, 3, 5).
   *
   * Extended cron uses this pattern for flexible interval scheduling within specific ranges.
   * For example: "9-17/2" for hours would trigger at 9:00, 11:00, 13:00, 15:00, 17:00.
   *
   * @param start - Range start value (numeric or named like "MON")
   * @param end - Range end value (numeric or named like "FRI")
   * @param step - Step interval as string (must be positive integer)
   * @param min - Minimum allowed value for this field type
   * @param max - Maximum allowed value for this field type
   * @param type - Field type for context-aware validation (dayOfWeek gets special handling)
   * @returns boolean - True if the range-step pattern is valid for EventBridge
   */
  private _validateRangeWithStep(
    start: string,
    end: string,
    step: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Validate step value - must be positive integer
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;

    // Special handling for day-of-week ranges (supports named days like MON-FRI)
    // Extended cron allows both numeric (1-7) and named day ranges
    if (type === 'dayOfWeek') {
      return this._isValidDayOfWeek(start) && this._isValidDayOfWeek(end);
    }

    // Special handling for month ranges (supports named months like JAN-DEC)
    // Extended cron allows both numeric (1-12) and named month ranges
    if (type === 'month') {
      const startValid =
        this._isValidMonthName(start) ||
        this._validateSingleValue(start, min, max, type);
      const endValid =
        this._isValidMonthName(end) ||
        this._validateSingleValue(end, min, max, type);
      return startValid && endValid;
    }

    // Validate numeric ranges for other field types
    // Ensures range boundaries are valid and logical (start <= end)
    const startNum = Number(start);
    const endNum = Number(end);
    return (
      !isNaN(startNum) &&
      !isNaN(endNum) &&
      startNum >= min &&
      endNum <= max &&
      startNum <= endNum
    );
  }

  /**
   * Validates simple range patterns without step intervals.
   *
   * This method handles basic range patterns like "1-5" (values 1 through 5) or
   * "MON-FRI" (Monday through Friday). Extended cron supports both numeric and
   * named ranges for flexible scheduling.
   *
   * Examples:
   * - "9-17" for hours: triggers every hour from 9:00 to 17:00 (9am to 5pm)
   * - "MON-FRI" for day-of-week: triggers Monday through Friday
   * - "JAN-MAR" for months: triggers January through March
   *
   * @param start - Range start value (numeric or named)
   * @param end - Range end value (numeric or named)
   * @param min - Minimum allowed value for this field type
   * @param max - Maximum allowed value for this field type
   * @param type - Field type for validation context (affects named value handling)
   * @returns boolean - True if the range pattern is valid for EventBridge
   */
  private _validateSimpleRange(
    start: string,
    end: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle day-of-week ranges with named values (MON-FRI, SUN-SAT, etc.)
    // Extended cron supports both numeric (1-7) and named day ranges
    if (type === 'dayOfWeek') {
      return this._isValidDayOfWeek(start) && this._isValidDayOfWeek(end);
    }

    // Handle month ranges with named values (JAN-DEC, etc.)
    // Extended cron allows both numeric (1-12) and named month ranges
    if (type === 'month') {
      const startValid =
        this._isValidMonthName(start) ||
        this._validateSingleValue(start, min, max, type);
      const endValid =
        this._isValidMonthName(end) ||
        this._validateSingleValue(end, min, max, type);
      return startValid && endValid;
    }

    // Validate numeric ranges for other field types
    // Ensures both range boundaries are numeric, within limits, and logical (start <= end)
    const startNum = Number(start);
    const endNum = Number(end);
    return (
      !isNaN(startNum) &&
      !isNaN(endNum) &&
      startNum >= min &&
      endNum <= max &&
      startNum <= endNum
    );
  }

  /**
   * Validates step patterns from a starting point.
   *
   * This method handles step patterns like "5/10" (every 10th value starting from 5)
   * or asterisk/15 (every 15th value starting from minimum). Extended cron uses this for
   * interval-based scheduling from specific starting points.
   *
   * Examples:
   * - "0/15" for minutes: triggers at 0, 15, 30, 45 minutes past the hour
   * - asterisk/5 for minutes: triggers every 5 minutes (0, 5, 10, 15, ...)
   * - "2/3" for day-of-month: triggers every 3rd day starting from the 2nd (2, 5, 8, ...)
   *
   * @param start - Starting value (can be asterisk for wildcard start or specific value)
   * @param step - Step interval as string (must be positive integer)
   * @param min - Minimum allowed value for this field type
   * @param max - Maximum allowed value for this field type
   * @param type - Field type for validation context
   * @returns boolean - True if the step pattern is valid for EventBridge
   */
  private _validateStepField(
    start: string,
    step: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Validate step value - must be positive integer
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;

    // Handle wildcard start: asterisk/step means start from minimum value with given step
    // This is the most common pattern for regular intervals (e.g., asterisk/15 = every 15 minutes)
    if (start === '*') return true;

    // Handle named day values for day-of-week step patterns
    // Extended cron supports patterns like "MON/2" (every 2nd occurrence starting Monday)
    if (type === 'dayOfWeek') {
      return this._isValidDayOfWeek(start);
    }

    // Validate numeric start values - must be within field's valid range
    // Extended cron requires the starting point to be a valid value for the field type
    const startNum = Number(start);
    return !isNaN(startNum) && startNum >= min && startNum <= max;
  }

  /**
   * Validates day-of-month field with special characters.
   */
  private _validateDayOfMonth(dayOfMonth: string): boolean {
    return this._validateComplexField(dayOfMonth, 1, 31, 'dayOfMonth');
  }

  /**
   * Validates month field with support for named months.
   */
  private _validateMonth(month: string): boolean {
    return this._validateComplexField(month, 1, 12, 'month');
  }

  /**
   * Validates day-of-week field with support for named days and special characters.
   */
  private _validateDayOfWeek(dayOfWeek: string): boolean {
    // Check for multiple hash expressions in day-of-week field
    if (dayOfWeek.includes(',') && dayOfWeek.includes('#')) {
      const parts = dayOfWeek.split(',');
      const hashCount = parts.filter((part) =>
        part.trim().includes('#')
      ).length;

      // AWS EventBridge: Only one hash expression allowed per day-of-week field
      if (hashCount > 1) {
        return false;
      }
    }

    return this._validateComplexField(dayOfWeek, 1, 7, 'dayOfWeek');
  }

  /**
   * Validates mutual exclusivity rule for day-of-month and day-of-week fields.
   * Extended cron requires that one of these fields must be a wildcard.
   */
  private _validateDayMutualExclusivity(
    dayOfMonth: string,
    dayOfWeek: string
  ): boolean {
    // Both cannot be specific values - one must be * or ?
    const dayOfMonthIsWildcard = dayOfMonth === '*' || dayOfMonth === '?';
    const dayOfWeekIsWildcard = dayOfWeek === '*' || dayOfWeek === '?';

    return dayOfMonthIsWildcard || dayOfWeekIsWildcard;
  }

  /**
   * Checks if a value represents a valid day of the week (numeric or named).
   */
  private _isValidDayOfWeek(day: string): boolean {
    const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    if (validDays.includes(day.toUpperCase())) return true;

    const num = Number(day);
    return !isNaN(num) && num >= 1 && num <= 7;
  }

  /**
   * Checks if a value represents a valid month name.
   */
  private _isValidMonthName(month: string): boolean {
    const validMonths = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ];
    return validMonths.includes(month.toUpperCase());
  }
}

/**
 * Injection token for `CpsCronValidationService`.
 *
 * Always inject this token instead of `CpsCronValidationService` directly.
 * This allows consumer applications to override or disable cron validation by
 * providing an alternative implementation via `providers`.
 *
 * @example
 * // Inject in a component or service
 * private readonly cronValidation = inject(CPS_CRON_VALIDATION_SERVICE);
 *
 * @example
 * // Override with a custom implementation
 * providers: [{ provide: CPS_CRON_VALIDATION_SERVICE, useClass: MyCustomCronValidationService }]
 *
 * @example
 * // Disable cron validation entirely
 * providers: [{ provide: CPS_CRON_VALIDATION_SERVICE, useValue: null }]
 *
 * @group Tokens
 */
export const CPS_CRON_VALIDATION_SERVICE =
  new InjectionToken<CpsCronValidationService | null>(
    'CPS_CRON_VALIDATION_SERVICE',
    {
      providedIn: 'root',
      factory: () => inject(CpsCronValidationService)
    }
  );
