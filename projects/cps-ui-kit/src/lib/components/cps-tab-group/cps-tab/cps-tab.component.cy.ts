import { CommonModule } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { mount } from '@cypress/angular';
import { CpsIconComponent } from 'projects/cps-ui-kit/src/lib/components/cps-icon/cps-icon.component';
import { CpsTabComponent } from './cps-tab.component';

describe('CpsTabComponent', () => {
  beforeEach(() => {
    getTestBed().resetTestingModule();
  });

  it('should create', () => {
    cy.mount(`
        <cps-tab #tab label="Test Tab">
            <div id="test-content">This is test content</div>
        </cps-tab>
    `, {
      imports: [CpsTabComponent, CommonModule, CpsIconComponent]
    }).then(() => {
      cy.get('cps-tab').should('not.contain.text', 'Test Tab');
      cy.get('[label="Test Tab"]').should('exist');
      cy.get('#test-content').should('exist');
      cy.get('#test-content').should('contain.text', 'This is test content');
    });
  });
});

