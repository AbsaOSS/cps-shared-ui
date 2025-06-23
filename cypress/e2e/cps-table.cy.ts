const path = require('path');

describe('cps-table page', () => {
  describe('export to xlsx', () => {
    beforeEach(() => {
      cy.visit('/table');
    });

    it('should properly download valid xlsx', () => {
      cy.contains('Table 6').click({ force: true });
      cy.get('.cps-table-tbar-export-btn cps-icon').click();
      cy.contains('XLSX').click();

      const downloadsFolder = Cypress.config('downloadsFolder');
      const downloadedFilePath = path.join(downloadsFolder, 'table_6.xlsx');
      cy.readFile(downloadedFilePath).should('exist');

      cy.fixture('table_6_fixture.xlsx').then((fixtureContent) => {
        cy.readFile(downloadedFilePath).then((downloadedFileContent) => {
          expect(downloadedFileContent).equals(fixtureContent);
        });
      });
    });
  });
});
