describe('cps-autocomplete page', () => {
  describe('required single autocomplete with a tooltip', () => {
    beforeEach(() => {
      cy.visit('/autocomplete');
    });

    it('should select items properly', () => {
      cy.get("[data-cy='required-autocomplete']").click();
      cy.contains('Rome').click();
      cy.get("[data-cy='required-autocomplete'] .single-item-selection").should(
        'have.text',
        'Rome'
      );
      cy.get("[data-cy='required-autocomplete']").click();
      cy.contains('Prague').click();
      cy.get("[data-cy='required-autocomplete'] .single-item-selection").should(
        'have.text',
        'Prague'
      );
    });

    it('should clear items', () => {
      cy.get("[data-cy='required-autocomplete'] .single-item-selection").should(
        'have.text',
        'Prague'
      );
      cy.get(
        "[data-cy='required-autocomplete'] .cps-autocomplete-box-clear-icon"
      ).click();
      cy.get('body').click(0, 0);
      cy.contains('Field is required');
      cy.get("[data-cy='required-autocomplete'] .single-item-selection").should(
        'not.exist'
      );
    });
  });
});
