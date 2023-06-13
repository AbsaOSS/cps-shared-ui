import {CpsAutocompleteComponent} from './cps-autocomplete.component';

describe('CpsAutocompleteComponent', () => {
  const options = [
    {name: 'New York', data: {code: 'NY'}},
    {name: 'Prague', data: {code: 'PRG'}, info: 'Prague info'},
    {name: 'Capetown', data: {code: 'CPT'}, info: 'Capetown info'},
    {name: 'Rome', data: {code: 'RM'}},
    {name: 'London', data: {code: 'LDN'}, info: 'London info'},
    {name: 'Istanbul', data: {code: 'IST'}},
    {name: 'Paris', data: {code: 'PRS'}},
    {name: 'Tokyo', data: {code: 'TOK'}},
    {name: 'Oslo', data: {code: 'OSL'}, info: 'Oslo info'},
    {name: 'Berlin', data: {code: 'BER'}}
  ];

  const config = {
    componentProperties: {
      options: options,
      optionLabel: 'name',
    }
  }

  it('should mount', () => {
    cy.mount(CpsAutocompleteComponent);
  });

  it('should display the correct placeholder text', () => {
    const placeholder = 'Select a city';
    cy.mount(CpsAutocompleteComponent, {
      componentProperties: {
        ...config.componentProperties,
        placeholder: placeholder,
      },
    });
    cy.get('.cps-autocomplete-box-input').should('have.attr', 'placeholder', placeholder);
  });

  it('should open dropdown and select first option', () => {
    let component: CpsAutocompleteComponent;
    cy.mount(CpsAutocompleteComponent, config).then((c: { componentInstance: CpsAutocompleteComponent; }) => {
      component = c.componentInstance;
      cy.get('[data-cy-id=cps-autocomplete]').click();
      cy.get('[data-cy-id=cps-autocomplete-options]').should('have.length', options.length);
      cy.get('[data-cy-id=cps-autocomplete-options]').first().click();
      cy.get('.single-item-selection span').should('have.text', options[0].name);
    });
  });

  it('should display chips when multiple options are selected', () => {
    cy.mount(CpsAutocompleteComponent, {
      componentProperties: {
        ...config.componentProperties,
        multiple: true,
        chips: true,
      },
    });
    cy.get('[data-cy-id=cps-autocomplete]').click();
    cy.get('[data-cy-id=cps-autocomplete-options]').first().click();
    cy.get('[data-cy-id=cps-autocomplete-options]').eq(1).click();
    cy.get('cps-chip').should('have.length', 2);
  });

  it('should scroll to previously selected value when opened again', () => {
    cy.mount(CpsAutocompleteComponent, config);
    cy.get('[data-cy-id=cps-autocomplete]').click();
    cy.get('[data-cy-id=cps-autocomplete-options]').last().click();
    cy.get('[data-cy-id=cps-autocomplete]').click();
    cy.get('[data-cy-id=cps-autocomplete-options]').last().should('be.visible');
  });

});
