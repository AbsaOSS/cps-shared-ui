describe('CPS Scheduler Component', () => {
  beforeEach(() => {
    cy.visit('/scheduler/examples');
    cy.get('cps-scheduler').should('be.visible');
  });

  /**
   * Dropdown selection helper
   */
  const selectDropdownOption = (selector: string, optionText: string): void => {
    // Click the dropdown to open it
    cy.get(selector).click();

    // Try to find and click the option with the specified text
    // Use a more generic approach that waits for any clickable element containing the text
    cy.get('body').contains(optionText).should('be.visible').click();
  };

  describe('Core Functionality', () => {
    it('should display scheduler with proper initialization', () => {
      cy.get('[data-cy="schedule-type-toggle"]').should('be.visible');
      cy.get('[data-cy="schedule-type-toggle"]').should(
        'contain.text',
        'Not set'
      );
    });
  });

  describe('Minutes Schedule - Cron Generation', () => {
    beforeEach(() => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Minutes').click();
      cy.get('[data-cy="minutes-config"]').should('be.visible');
    });

    it('should generate cron expression for minute intervals', () => {
      selectDropdownOption('[data-cy="minutes-input"]', '5');

      // Switch to Advanced to see generated cron
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('have.value', '0/5 * 1/1 * ? *');
    });

    it('should generate cron expression for 15-minute intervals', () => {
      selectDropdownOption('[data-cy="minutes-input"]', '15');

      // Switch to Advanced to see generated cron
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('have.value', '0/15 * 1/1 * ? *');
    });
  });

  describe('Weekly Schedule - Cron Generation', () => {
    beforeEach(() => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Weekly').click();
      cy.get('[data-cy="weekly-config"]').should('be.visible');
    });

    it('should generate correct cron for Monday and Wednesday', () => {
      cy.get('[data-cy="weekly-MON"]').click();
      cy.get('[data-cy="weekly-WED"]').click();

      cy.wait(1000);

      // Verify timezone selector appears
      cy.get('[data-cy="timezone-selector"]').should('be.visible');

      // Verify specific cron expression is generated
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('have.value', '0 0 ? * MON,WED *');
    });

    it('should generate correct cron for Friday only', () => {
      // First ensure Monday is unchecked
      cy.get('[data-cy="weekly-MON"]').within(() => {
        cy.get('input[type="checkbox"]').uncheck({ force: true });
      });

      // Check Friday
      cy.get('[data-cy="weekly-FRI"]').within(() => {
        cy.get('input[type="checkbox"]').check({ force: true });
      });

      cy.wait(1000);

      // Verify timezone selector appears
      cy.get('[data-cy="timezone-selector"]').should('be.visible');

      // Verify specific cron expression is generated
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('have.value', '0 0 ? * FRI *');
    });
  });

  describe('Monthly Schedule - Cron Generation', () => {
    beforeEach(() => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Monthly').click();
      cy.get('[data-cy="monthly-config"]').should('be.visible');
    });

    it('should generate correct cron for specific weekday (Second Tuesday of every month)', () => {
      // Select Second week
      selectDropdownOption('[data-cy="monthly-week-select"]', 'Second');

      // Select Tuesday
      selectDropdownOption('[data-cy="monthly-weekday-select"]', 'Tuesday');

      // Select starting month as April
      selectDropdownOption(
        '[data-cy="monthly-weekday-start-month-select"]',
        'April'
      );

      // Verify timezone selector appears
      cy.get('[data-cy="timezone-selector"]').should('be.visible');

      // Switch to Advanced to see generated cron
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('contain.value', '30 9 ? 4/4 TUE#2 *');
    });

    it('should generate correct cron for specific weekday (Fourth Sunday starting in October)', () => {
      // Select Fourth week
      selectDropdownOption('[data-cy="monthly-week-select"]', 'Fourth');

      // Select Sunday
      selectDropdownOption('[data-cy="monthly-weekday-select"]', 'Sunday');

      // Select starting month as October
      selectDropdownOption(
        '[data-cy="monthly-weekday-start-month-select"]',
        'October'
      );

      // Set custom time to 14:45 (2:45 PM)
      cy.get('[data-cy="monthly-weekday-timepicker"]').within(() => {
        cy.get('input').eq(1).clear().type('45');
        cy.get('input').first().clear().type('14');
      });

      // Switch to Advanced to see generated cron
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input')
        .should('contain.value', '45 14 ? 10/4 SUN#4 *');
    });
  });

  describe('Advanced Schedule - Direct Input', () => {
    beforeEach(() => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-config"]').should('be.visible');
    });

    it('should accept valid cron expressions', () => {
      const testCron = '0 30 14 ? * MON-FRI';

      cy.get('[data-cy="advanced-cron-input"]')
        .find('input, textarea')
        .clear()
        .type(testCron);

      cy.wait(1000);

      // Verify input contains the cron
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input, textarea')
        .should('have.value', testCron);
    });

    it('should handle invalid cron expressions', () => {
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input, textarea')
        .clear()
        .type('invalid cron');

      cy.wait(1000);

      // Component should not crash
      cy.get('[data-cy="advanced-cron-input"]').should('be.visible');

      // Check validation state
      cy.get('body').then(($body) => {
        const hasError = $body.find('.ng-invalid, .error').length > 0;
        expect(hasError).to.be.true;
      });
    });
  });

  describe('State Management', () => {
    it('should maintain state when switching between schedule types', () => {
      // Set up Weekly schedule
      cy.get('[data-cy="schedule-type-toggle"]').contains('Weekly').click();
      cy.get('[data-cy="weekly-MON"]').click();

      cy.wait(1000);

      // Switch to Advanced to verify cron was generated
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      cy.get('[data-cy="advanced-cron-input"]')
        .find('input, textarea')
        .should('not.have.value', '');

      // Switch back to Weekly
      cy.get('[data-cy="schedule-type-toggle"]').contains('Weekly').click();
      cy.get('[data-cy="weekly-config"]').should('be.visible');
    });

    it('should reset when selecting Not set', () => {
      // First set a schedule
      cy.get('[data-cy="schedule-type-toggle"]').contains('Weekly').click();
      cy.get('[data-cy="weekly-MON"]').click();

      cy.wait(1000);

      // Reset to Not set
      cy.get('[data-cy="schedule-type-toggle"]').contains('Not set').click();

      // Component should be in reset state
      cy.get('cps-scheduler').should('be.visible');
      cy.get('[data-cy="schedule-type-toggle"]').should(
        'contain.text',
        'Not set'
      );
    });
  });

  describe('Timezone Functionality', () => {
    it('should allow timezone filtering and show autocomplete options', () => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();
      // Type in the autocomplete to filter timezone options
      cy.get('[data-cy="timezone-select"]')
        .find('input')
        .clear()
        .type('UTC', { force: true });

      cy.wait(500);

      // Verify that autocomplete dropdown appears with options
      cy.get('.cps-autocomplete-options, .cps-autocomplete-option').should(
        'exist'
      );

      // Verify the input field contains what we typed
      cy.get('[data-cy="timezone-select"]')
        .find('input')
        .should('have.value', 'UTC');
    });

    it('should maintain typed text in timezone input', () => {
      cy.get('[data-cy="schedule-type-toggle"]').contains('Advanced').click();

      // Type a specific timezone
      cy.get('[data-cy="timezone-select"]')
        .find('input')
        .clear()
        .type('Europe/London', { force: true });

      cy.wait(500);

      // Verify the text remains in the input
      cy.get('[data-cy="timezone-select"]')
        .find('input')
        .should('have.value', 'Europe/London');

      // Verify timezone selector is still functional
      cy.get('[data-cy="timezone-select"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle rapid type switching', () => {
      const types = ['Minutes', 'Hourly', 'Weekly', 'Advanced'] as const;

      types.forEach((type) => {
        cy.get('[data-cy="schedule-type-toggle"]').contains(type).click();
        cy.wait(200);
      });

      // Should end in valid state
      cy.get('[data-cy="advanced-config"]').should('be.visible');
    });
  });
});
