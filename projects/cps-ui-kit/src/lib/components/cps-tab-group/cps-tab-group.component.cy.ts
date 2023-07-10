import { Component } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { mount } from '@cypress/angular';
import { CpsTabGroupComponent } from './cps-tab-group.component';
import { CpsTabComponent } from './cps-tab/cps-tab.component';

@Component({
  template: `
    <cps-tab-group selectedIndex="0">
      <cps-tab label="Tab 1">
        <div id="tab-content-1">This is content for Tab 1</div>
      </cps-tab>
      <cps-tab label="Tab 2">
        <div id="tab-content-2">This is content for Tab 2</div>
      </cps-tab>
    </cps-tab-group>
  `
})
export class MockTabGroupComponent { }

describe('CpsTabGroupComponent', () => {
  beforeEach(() => {
    getTestBed().resetTestingModule();
  });


  it('should create and select first tab by default', () => {
    cy.mount(MockTabGroupComponent, {
      imports: [CpsTabGroupComponent, CpsTabComponent, NoopAnimationsModule]
    });
    cy.get('li').should('have.length', 2); // check that 2 tabs are created
    cy.get('li.active a').should('contain.text', 'Tab 1'); // first tab should be active
    cy.get('#tab-content-1').should('be.visible'); // first tab content should be visible
    cy.get('#tab-content-2').should('not.be.visible'); // second tab content should not be visible
  });

  it('should switch tabs on click', () => {
    cy.mount(MockTabGroupComponent, {
      imports: [CpsTabGroupComponent, CpsTabComponent, NoopAnimationsModule]
    });
    cy.get('li').eq(1).click(); // click the second tab
    cy.get('li.active a').should('contain.text', 'Tab 2'); // second tab should now be active
    cy.get('#tab-content-2').should('be.visible'); // second tab content should now be visible
    cy.get('#tab-content-1').should('not.be.visible'); // first tab content should not be visible
  });
});
