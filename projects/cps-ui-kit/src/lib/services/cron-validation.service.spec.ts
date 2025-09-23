import { TestBed } from '@angular/core/testing';
import { CronValidationService } from './cron-validation.service';

describe('CronValidationService', () => {
  let service: CronValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CronValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Structure Validation', () => {
    it('should validate 6-field cron expressions', () => {
      expect(service.isValidCron('0 12 * * ? *')).toBe(true);
      expect(service.isValidCron('0 12 * *')).toBe(false); // Only 4 fields
      expect(service.isValidCron('0 12 * * ? * extra')).toBe(false); // 7 fields
    });

    it('should handle empty expressions based on allowEmpty parameter', () => {
      expect(service.isValidCron('', true)).toBe(true);
      expect(service.isValidCron('', false)).toBe(false);
      expect(service.isValidCron('')).toBe(false); // Default allowEmpty = false
    });

    it('should reject non-string inputs', () => {
      expect(service.isValidCron(null as any)).toBe(false);
      expect(service.isValidCron(undefined as any)).toBe(false);
      expect(service.isValidCron(123 as any)).toBe(false);
    });
  });

  describe('Range Pattern Validation', () => {
    describe('Numeric Ranges', () => {
      it('should validate simple numeric ranges', () => {
        expect(service.isValidCron('0 9-17 * * ? *')).toBe(true); // 9am to 5pm
        expect(service.isValidCron('1-5 * * * ? *')).toBe(true); // Minutes 1-5
        expect(service.isValidCron('0 0 1-15 * ? *')).toBe(true); // First half of month
      });

      it('should validate ranges with steps', () => {
        expect(service.isValidCron('0 9-17/2 * * ? *')).toBe(true); // Every 2nd hour 9-17
        expect(service.isValidCron('1-30/5 * * * ? *')).toBe(true); // Every 5th minute 1-30
        expect(service.isValidCron('0 0 1-31/7 * ? *')).toBe(true); // Every 7th day
      });

      it('should reject invalid numeric ranges', () => {
        expect(service.isValidCron('0 25-30 * * ? *')).toBe(false); // Hour 25 invalid
        expect(service.isValidCron('60-65 * * * ? *')).toBe(false); // Minute 60+ invalid
        expect(service.isValidCron('0 0 32-35 * ? *')).toBe(false); // Day 32+ invalid
      });

      it('should reject backwards ranges', () => {
        expect(service.isValidCron('0 17-9 * * ? *')).toBe(false); // End before start
        expect(service.isValidCron('30-10 * * * ? *')).toBe(false); // Backwards minute range
      });
    });

    describe('Named Day Ranges', () => {
      it('should validate named day ranges', () => {
        expect(service.isValidCron('0 9 ? * MON-FRI *')).toBe(true); // Weekdays
        expect(service.isValidCron('0 9 ? * SAT-SUN *')).toBe(true); // Weekend
        expect(service.isValidCron('0 9 ? * TUE-THU *')).toBe(true); // Tue-Thu
      });

      it('should validate mixed case day names', () => {
        expect(service.isValidCron('0 9 ? * mon-fri *')).toBe(true);
        expect(service.isValidCron('0 9 ? * Mon-Fri *')).toBe(true);
      });

      it('should validate day ranges with steps', () => {
        expect(service.isValidCron('0 9 ? * MON-FRI/2 *')).toBe(true); // Every other weekday
        expect(service.isValidCron('0 9 ? * SUN-SAT/3 *')).toBe(true); // Every 3rd day
      });

      it('should reject invalid day names', () => {
        expect(service.isValidCron('0 9 ? * INVALID-FRI *')).toBe(false);
        expect(service.isValidCron('0 9 ? * MON-INVALID *')).toBe(false);
      });
    });

    describe('Named Month Ranges', () => {
      it('should validate named month ranges', () => {
        expect(service.isValidCron('0 9 15 JAN-MAR ? *')).toBe(true); // Q1
        expect(service.isValidCron('0 9 1 APR-JUN ? *')).toBe(true); // Q2
        expect(service.isValidCron('0 9 * JUL-SEP ? *')).toBe(true); // Q3
        expect(service.isValidCron('0 9 * OCT-DEC ? *')).toBe(true); // Q4
      });

      it('should validate month ranges with steps', () => {
        expect(service.isValidCron('0 9 1 JAN-DEC/3 ? *')).toBe(true); // Quarterly
        expect(service.isValidCron('0 9 15 JAN-JUN/2 ? *')).toBe(true); // Every other month
      });

      it('should validate mixed case month names', () => {
        expect(service.isValidCron('0 9 1 jan-mar ? *')).toBe(true);
        expect(service.isValidCron('0 9 1 Jan-Mar ? *')).toBe(true);
      });

      it('should reject invalid month names', () => {
        expect(service.isValidCron('0 9 1 INVALID-MAR ? *')).toBe(false);
        expect(service.isValidCron('0 9 1 JAN-INVALID ? *')).toBe(false);
      });
    });
  });

  describe('Step Pattern Validation', () => {
    it('should validate wildcard step patterns', () => {
      expect(service.isValidCron('*/15 * * * ? *')).toBe(true); // Every 15 minutes
      expect(service.isValidCron('0 */4 * * ? *')).toBe(true); // Every 4 hours
      expect(service.isValidCron('0 0 */5 * ? *')).toBe(true); // Every 5 days
    });

    it('should validate numeric step patterns', () => {
      expect(service.isValidCron('5/10 * * * ? *')).toBe(true); // Every 10min from 5
      expect(service.isValidCron('0 2/6 * * ? *')).toBe(true); // Every 6hr from 2am
      expect(service.isValidCron('0 0 1/14 * ? *')).toBe(true); // Every 14 days from 1st
    });

    it('should reject invalid step values', () => {
      expect(service.isValidCron('*/0 * * * ? *')).toBe(false); // Step 0 invalid
      expect(service.isValidCron('*/-5 * * * ? *')).toBe(false); // Negative step
      expect(service.isValidCron('*/abc * * * ? *')).toBe(false); // Non-numeric step
    });
  });

  describe('List Pattern Validation', () => {
    it('should validate numeric lists', () => {
      expect(service.isValidCron('0,15,30,45 * * * ? *')).toBe(true); // Specific minutes
      expect(service.isValidCron('0 9,12,17 * * ? *')).toBe(true); // Specific hours
      expect(service.isValidCron('0 0 1,15 * ? *')).toBe(true); // 1st and 15th
    });

    it('should validate named day lists', () => {
      expect(service.isValidCron('0 9 ? * MON,WED,FRI *')).toBe(true);
      expect(service.isValidCron('0 9 ? * SAT,SUN *')).toBe(true);
    });

    it('should validate named month lists', () => {
      expect(service.isValidCron('0 9 1 JAN,APR,JUL,OCT ? *')).toBe(true); // Quarterly
      expect(service.isValidCron('0 9 * JUN,JUL,AUG ? *')).toBe(true); // Summer
    });

    it('should validate mixed lists (ranges and values)', () => {
      expect(service.isValidCron('0 9 1,15,L * ? *')).toBe(true); // 1st, 15th, last day
      expect(service.isValidCron('0 9 ? * MON-WED,FRI *')).toBe(true); // Mon-Wed + Fri
    });

    it('should reject lists with invalid values', () => {
      expect(service.isValidCron('0,70 * * * ? *')).toBe(false); // Minute 70 invalid
      expect(service.isValidCron('0 25,26 * * ? *')).toBe(false); // Hours 25,26 invalid
    });
  });

  describe('Special Characters', () => {
    describe('L (Last) Character', () => {
      it('should validate L in day-of-month field', () => {
        expect(service.isValidCron('0 9 L * ? *')).toBe(true); // Last day of month
        expect(service.isValidCron('0 9 1,15,L * ? *')).toBe(true); // 1st, 15th, last
      });

      it('should validate L with day names in day-of-week field', () => {
        expect(service.isValidCron('0 9 ? * FRIL *')).toBe(true); // Last Friday
        expect(service.isValidCron('0 9 ? * SUNL *')).toBe(true); // Last Sunday
      });

      it('should reject L in invalid fields', () => {
        expect(service.isValidCron('L 9 * * ? *')).toBe(false); // L in minutes
        expect(service.isValidCron('0 L * * ? *')).toBe(false); // L in hours
      });
    });

    describe('W (Weekday) Character', () => {
      it('should validate W with day numbers', () => {
        expect(service.isValidCron('0 9 15W * ? *')).toBe(true); // Weekday nearest 15th
        expect(service.isValidCron('0 9 1W * ? *')).toBe(true); // Weekday nearest 1st
      });

      it('should validate LW (last weekday)', () => {
        expect(service.isValidCron('0 9 LW * ? *')).toBe(true);
      });

      it('should reject W in invalid contexts', () => {
        expect(service.isValidCron('0 9W * * ? *')).toBe(false); // W without number
        expect(service.isValidCron('0 9 ? * MONW *')).toBe(false); // W with day name
      });
    });

    describe('# (Hash) Character', () => {
      it('should validate hash with day names', () => {
        expect(service.isValidCron('0 9 ? * MON#1 *')).toBe(true); // 1st Monday
        expect(service.isValidCron('0 9 ? * FRI#2 *')).toBe(true); // 2nd Friday
        expect(service.isValidCron('0 9 ? * SUN#5 *')).toBe(true); // 5th Sunday
      });

      it('should reject invalid hash patterns', () => {
        expect(service.isValidCron('0 9 ? * MON#0 *')).toBe(false); // Week 0 invalid
        expect(service.isValidCron('0 9 ? * MON#6 *')).toBe(false); // Week 6 invalid
        expect(service.isValidCron('0 9 15#1 * ? *')).toBe(false); // Hash in day-of-month
      });
    });
  });

  describe('Mutual Exclusivity Rules', () => {
    it('should enforce day-of-month and day-of-week mutual exclusivity', () => {
      expect(service.isValidCron('0 9 15 * ? *')).toBe(true); // Specific day, any weekday
      expect(service.isValidCron('0 9 ? * MON *')).toBe(true); // Any day, specific weekday
      expect(service.isValidCron('0 9 15 * MON *')).toBe(false); // Both specific - invalid
    });

    it('should allow wildcards in both day fields', () => {
      expect(service.isValidCron('0 9 * * ? *')).toBe(true);
      expect(service.isValidCron('0 9 ? * * *')).toBe(true);
    });
  });

  describe('Field Range Validation', () => {
    it('should validate field ranges correctly', () => {
      // Minutes: 0-59
      expect(service.isValidCron('0 9 * * ? *')).toBe(true);
      expect(service.isValidCron('59 9 * * ? *')).toBe(true);
      expect(service.isValidCron('60 9 * * ? *')).toBe(false);

      // Hours: 0-23
      expect(service.isValidCron('0 0 * * ? *')).toBe(true);
      expect(service.isValidCron('0 23 * * ? *')).toBe(true);
      expect(service.isValidCron('0 24 * * ? *')).toBe(false);

      // Day-of-month: 1-31
      expect(service.isValidCron('0 9 1 * ? *')).toBe(true);
      expect(service.isValidCron('0 9 31 * ? *')).toBe(true);
      expect(service.isValidCron('0 9 32 * ? *')).toBe(false);

      // Month: 1-12
      expect(service.isValidCron('0 9 * 1 ? *')).toBe(true);
      expect(service.isValidCron('0 9 * 12 ? *')).toBe(true);
      expect(service.isValidCron('0 9 * 13 ? *')).toBe(false);

      // Day-of-week: 1-7
      expect(service.isValidCron('0 9 ? * 1 *')).toBe(true);
      expect(service.isValidCron('0 9 ? * 7 *')).toBe(true);
      expect(service.isValidCron('0 9 ? * 8 *')).toBe(false);

      // Year: 1970-2199
      expect(service.isValidCron('0 9 * * ? 1970')).toBe(true);
      expect(service.isValidCron('0 9 * * ? 2199')).toBe(true);
      expect(service.isValidCron('0 9 * * ? 2200')).toBe(false);
    });
  });

  describe('Complex Real-World Patterns', () => {
    it('should validate business hour patterns', () => {
      expect(service.isValidCron('0 9-17 * * MON-FRI *')).toBe(true);
      expect(service.isValidCron('*/15 9-17 * * MON-FRI *')).toBe(true);
    });

    it('should validate quarterly patterns', () => {
      expect(service.isValidCron('0 9 1 JAN,APR,JUL,OCT ? *')).toBe(true);
      expect(service.isValidCron('0 9 1 1,4,7,10 ? *')).toBe(true);
    });

    it('should validate maintenance windows', () => {
      expect(service.isValidCron('0 2 * * SUN *')).toBe(true); // Sunday 2am
      expect(service.isValidCron('0 2 L * ? *')).toBe(true); // Last day 2am
    });

    it('should validate reporting schedules', () => {
      expect(service.isValidCron('0 8 1,15 * ? *')).toBe(true); // Bi-monthly
      expect(service.isValidCron('0 8 ? * MON#1 *')).toBe(true); // First Monday
    });
  });
});
