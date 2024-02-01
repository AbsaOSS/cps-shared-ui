import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CpsExpansionPanelComponent } from './cps-expansion-panel.component';

describe('CpsExpansionPanelComponent', () => {
  it('should mount', () => {
    cy.mount(CpsExpansionPanelComponent, {
      imports: [BrowserAnimationsModule]
    });
  });
});
