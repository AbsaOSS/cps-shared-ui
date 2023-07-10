import { Component } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
export class MockTabGroupComponent {}

describe('CpsTabGroupComponent', () => {
  beforeEach(() => {
    getTestBed().resetTestingModule();
  });

  it('should create and select first tab by default', () => {
    cy.mount(MockTabGroupComponent, {
      imports: [CpsTabGroupComponent, CpsTabComponent, NoopAnimationsModule]
    });
    cy.get('li').should('have.length', 2);
    cy.get('li.active a').should('contain.text', 'Tab 1');
    cy.get('#tab-content-1').should('be.visible');
    cy.get('#tab-content-2').should('not.exist');
  });

  it('should switch tabs on click', () => {
    cy.mount(MockTabGroupComponent, {
      imports: [CpsTabGroupComponent, CpsTabComponent, NoopAnimationsModule]
    });
    cy.get('li').eq(1).click();
    cy.get('li.active a').should('contain.text', 'Tab 2');
    cy.get('#tab-content-2').should('be.visible');
    cy.get('#tab-content-1').should('not.exist');
  });
});
