import { Injectable } from '@angular/core';

/**
 * Service for validating AWS EventBridge Scheduler cron expressions.
 *
 * This service handles all cron validation logic, supporting the full EventBridge Scheduler
 * cron expression format which extends standard Unix cron with additional features for
 * cloud-scale scheduling.
 *
 * EventBridge Scheduler Format: minutes hours day-of-month month day-of-week year
 *
 * Key Features:
 * - Wildcards: asterisk (any value), question mark (any value for day fields)
 * - Ranges: 1-5, MON-FRI, JAN-MAR
 * - Steps: asterisk/15, 5/10, 1-5/2
 * - Lists: 1,3,5, MON,WED,FRI
 * - Special chars: L (last), W (weekday), hash (nth occurrence)
 */
@Injectable({
  providedIn: 'root'
})
export class CronValidationService {
  /**
   * Validates a complete EventBridge Scheduler cron expression.
   *
   * @param cron - The 6-field cron expression to validate
   * @param allowEmpty - Whether to allow empty cron expressions
   * @returns boolean - True if the cron expression is valid
   */
  isValidCron(cron: string, allowEmpty = false): boolean {
    if (typeof cron !== 'string') return false;

    if (allowEmpty && cron === '') return true;
    if (!cron) return false;

    const parts = cron.split(' ');
    if (parts.length !== 6) {
      return false;
    }

    // Validate each field according to EventBridge Scheduler rules
    return this.validateCronFields(parts);
  }

  /**
   * Validates all six fields of an EventBridge Scheduler cron expression.
   *
   * EventBridge Scheduler uses a 6-field cron format: minutes hours day-of-month month day-of-week year
   * This method orchestrates validation of each field according to AWS EventBridge Scheduler rules,
   * which extend standard Unix cron with additional features for cloud-scale scheduling.
   *
   * Field Ranges and Special Features:
   * - Minutes (0-59): Standard numeric, ranges, steps, lists
   * - Hours (0-23): Standard numeric, ranges, steps, lists
   * - Day-of-month (1-31): Numeric + special chars (L, W, LW)
   * - Month (1-12): Numeric or named (JAN-DEC), ranges, steps, lists
   * - Day-of-week (1-7): Numeric or named (SUN-SAT), special chars (L, hash)
   * - Year (1970-2199): Extended range for long-term scheduling
   *
   * Key EventBridge Rules:
   * - Day-of-month and day-of-week are mutually exclusive (one must be asterisk or question mark)
   * - Question mark (?) is only valid for day-of-month and day-of-week fields
   * - Special characters (L, W, hash) provide advanced scheduling capabilities
   *
   * @param parts - Array of 6 cron field strings [minutes, hours, dayOfMonth, month, dayOfWeek, year]
   * @returns boolean - True if all fields are valid and follow EventBridge Scheduler rules
   */
  private validateCronFields(parts: string[]): boolean {
    const [minutes, hours, dayOfMonth, month, dayOfWeek, year] = parts;

    // Validate minutes (0-59) - use enhanced validation
    if (!this.validateComplexField(minutes, 0, 59, 'minutes')) return false;

    // Validate hours (0-23) - use enhanced validation
    if (!this.validateComplexField(hours, 0, 23, 'hours')) return false;

    // Validate day of month (1-31 or wildcards)
    if (!this.validateDayOfMonth(dayOfMonth)) return false;

    // Validate month (1-12 or JAN-DEC) - use enhanced validation
    if (!this.validateMonth(month)) return false;

    // Validate day of week (1-7 or SUN-SAT) - enhanced method will handle this
    if (!this.validateDayOfWeek(dayOfWeek)) return false;

    // Validate year (1970-2199) - use enhanced validation
    if (!this.validateComplexField(year, 1970, 2199, 'year')) return false;

    // Validate mutual exclusivity of day-of-month and day-of-week
    if (!this.validateDayMutualExclusivity(dayOfMonth, dayOfWeek)) return false;

    return true;
  }

  /**
   * Enhanced validation for complex EventBridge Scheduler cron field patterns.
   * Supports all EventBridge features including ranges, steps, lists, and special characters.
   *
   * This method follows the AWS EventBridge Scheduler cron expression format which is based on
   * the Unix cron format but includes additional features for more flexible scheduling.
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
  private validateComplexField(
    field: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle wildcard characters - following EventBridge Scheduler mutual exclusivity rules
    // '*' means "any value" and is valid for all fields
    // '?' means "no specific value" and is only valid for day-of-month and day-of-week fields
    if (field === '*' || field === '?') {
      return type === 'dayOfMonth' || type === 'dayOfWeek' || field === '*';
    }

    // Handle comma-separated lists: "1,3,5" or "MON,WED,FRI" or "MON-WED,FRI"
    // Allows EventBridge to trigger on multiple specific values within a field
    if (field.includes(',')) {
      return field.split(',').every((val) => {
        const trimmedVal = val.trim();
        // Recursively validate each part of the list
        return this.validateComplexField(trimmedVal, min, max, type);
      });
    }

    // Handle complex range with step patterns: "1-5/2" (every 2nd value from 1 to 5)
    // This allows EventBridge to schedule at intervals within a specific range
    if (field.includes('-') && field.includes('/')) {
      const [range, step] = field.split('/');
      const [start, end] = range.split('-');
      return this.validateRangeWithStep(start, end, step, min, max, type);
    }

    // Handle simple range patterns: "1-5" (values from 1 to 5), "MON-FRI" (Monday to Friday)
    // EventBridge supports both numeric and named ranges for time-based scheduling
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return this.validateSimpleRange(start, end, min, max, type);
    }

    // Handle step patterns from start: "5/10" (every 10th value starting from 5)
    // EventBridge uses this for interval-based scheduling from a specific starting point
    if (field.includes('/')) {
      const [start, step] = field.split('/');
      return this.validateStepField(start, step, min, max, type);
    }

    // Handle single values and EventBridge special characters (L, W, hash)
    // These provide advanced scheduling capabilities like "last day of month" or "3rd Tuesday"
    return this.validateSingleValue(field, min, max, type);
  }

  /**
   * Validates single values and EventBridge Scheduler special characters.
   *
   * This method handles the validation of individual field values including:
   * - Numeric values within specified ranges
   * - Special EventBridge characters for advanced scheduling
   * - Named values like month names (JAN, FEB) and day names (SUN, MON)
   *
   * EventBridge Special Characters:
   * - L: Last day of month (day-of-month) or last occurrence of weekday (day-of-week)
   * - W: Nearest weekday to the specified day (day-of-month only)
   * - LW: Last weekday of the month (day-of-month only)
   * - hash: Nth occurrence of weekday (e.g., "3#2" = 3rd Tuesday of month)
   *
   * @param value - The single value to validate (e.g., "15", "L", "15W", "MON", "3#2")
   * @param min - Minimum valid numeric value for this field type
   * @param max - Maximum valid numeric value for this field type
   * @param type - The cron field type for context-specific validation
   * @returns boolean - True if the value is valid for EventBridge Scheduler
   */
  private validateSingleValue(
    value: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle special characters for day of month field
    // EventBridge supports advanced day-of-month scheduling patterns
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
    // EventBridge supports advanced day-of-week scheduling patterns
    if (type === 'dayOfWeek') {
      // 'MONL' = last Monday of month (last occurrence)
      if (value.endsWith('L')) {
        const day = value.slice(0, -1);
        return this.isValidDayOfWeek(day);
      }
      // '3#2' = 3rd Tuesday of month (3=Tuesday, 2=second occurrence)
      if (value.includes('#')) {
        const [day, week] = value.split('#');
        return (
          this.isValidDayOfWeek(day) && Number(week) >= 1 && Number(week) <= 5
        );
      }
      // Standard day names: SUN, MON, TUE, etc.
      if (this.isValidDayOfWeek(value)) return true;
    }

    // Handle month names (JAN, FEB, MAR, etc.) for month field
    // EventBridge allows both numeric (1-12) and named month values
    if (type === 'month' && this.isValidMonthName(value)) return true;

    // Validate numeric values within the specified range
    // This covers standard numeric scheduling (minutes: 0-59, hours: 0-23, etc.)
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Validates range patterns with step intervals for EventBridge Scheduler.
   *
   * This method handles complex range-step patterns like "1-5/2" which means
   * "every 2nd value from 1 to 5" (resulting in: 1, 3, 5).
   *
   * EventBridge uses this pattern for flexible interval scheduling within specific ranges.
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
  private validateRangeWithStep(
    start: string,
    end: string,
    step: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Validate step value - must be positive integer for EventBridge compliance
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;

    // Special handling for day-of-week ranges (supports named days like MON-FRI)
    // EventBridge allows both numeric (1-7) and named (SUN-SAT) day ranges
    if (type === 'dayOfWeek') {
      return this.isValidDayOfWeek(start) && this.isValidDayOfWeek(end);
    }

    // Special handling for month ranges (supports named months like JAN-DEC)
    // EventBridge allows both numeric (1-12) and named (JAN-DEC) month ranges
    if (type === 'month') {
      const startValid =
        this.isValidMonthName(start) ||
        this.validateSingleValue(start, min, max, type);
      const endValid =
        this.isValidMonthName(end) ||
        this.validateSingleValue(end, min, max, type);
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
   * Validates simple range patterns without step intervals for EventBridge Scheduler.
   *
   * This method handles basic range patterns like "1-5" (values 1 through 5) or
   * "MON-FRI" (Monday through Friday). EventBridge supports both numeric and
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
  private validateSimpleRange(
    start: string,
    end: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Handle day-of-week ranges with named values (MON-FRI, SUN-SAT, etc.)
    // EventBridge supports both numeric (1-7) and named day ranges
    if (type === 'dayOfWeek') {
      return this.isValidDayOfWeek(start) && this.isValidDayOfWeek(end);
    }

    // Handle month ranges with named values (JAN-DEC, etc.)
    // EventBridge allows both numeric (1-12) and named month ranges
    if (type === 'month') {
      const startValid =
        this.isValidMonthName(start) ||
        this.validateSingleValue(start, min, max, type);
      const endValid =
        this.isValidMonthName(end) ||
        this.validateSingleValue(end, min, max, type);
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
   * Validates step patterns from a starting point for EventBridge Scheduler.
   *
   * This method handles step patterns like "5/10" (every 10th value starting from 5)
   * or asterisk/15 (every 15th value starting from minimum). EventBridge uses this for
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
  private validateStepField(
    start: string,
    step: string,
    min: number,
    max: number,
    type: string
  ): boolean {
    // Validate step value - must be positive integer for EventBridge compliance
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;

    // Handle wildcard start: asterisk/step means start from minimum value with given step
    // This is the most common pattern for regular intervals (e.g., asterisk/15 = every 15 minutes)
    if (start === '*') return true;

    // Handle named day values for day-of-week step patterns
    // EventBridge supports patterns like "MON/2" (every 2nd occurrence starting Monday)
    if (type === 'dayOfWeek') {
      return this.isValidDayOfWeek(start);
    }

    // Validate numeric start values - must be within field's valid range
    // EventBridge requires the starting point to be a valid value for the field type
    const startNum = Number(start);
    return !isNaN(startNum) && startNum >= min && startNum <= max;
  }

  /**
   * Validates day-of-month field with special EventBridge characters.
   */
  private validateDayOfMonth(dayOfMonth: string): boolean {
    return this.validateComplexField(dayOfMonth, 1, 31, 'dayOfMonth');
  }

  /**
   * Validates month field with support for named months.
   */
  private validateMonth(month: string): boolean {
    return this.validateComplexField(month, 1, 12, 'month');
  }

  /**
   * Validates day-of-week field with support for named days and special characters.
   */
  private validateDayOfWeek(dayOfWeek: string): boolean {
    return this.validateComplexField(dayOfWeek, 1, 7, 'dayOfWeek');
  }

  /**
   * Validates mutual exclusivity rule for day-of-month and day-of-week fields.
   * EventBridge requires that one of these fields must be a wildcard.
   */
  private validateDayMutualExclusivity(
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
  private isValidDayOfWeek(day: string): boolean {
    const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    if (validDays.includes(day.toUpperCase())) return true;

    const num = Number(day);
    return !isNaN(num) && num >= 1 && num <= 7;
  }

  /**
   * Checks if a value represents a valid month name.
   */
  private isValidMonthName(month: string): boolean {
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
