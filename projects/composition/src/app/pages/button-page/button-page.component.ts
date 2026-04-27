import { Component } from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';

import ComponentData from '../../api-data/cps-button.json';

@Component({
  imports: [
    CpsButtonComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  selector: 'app-button-page',
  templateUrl: './button-page.component.html',
  styleUrls: ['./button-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonPageComponent {
  componentData = ComponentData;
  isLoading = false;

  onClickForLoading() {
    this.isLoading = true;
    setTimeout(() => (this.isLoading = false), 2000);
  }

  readonly examples = {
    solid: `
<cps-button label="Button" color="luxury"></cps-button>
<cps-button icon="add" label="Button with icon"></cps-button>
<cps-button icon="add" label="Button" color="surprise" iconPosition="after"></cps-button>
<cps-button label="Button" color="luxury" [disabled]="true"></cps-button>
<cps-button [loading]="true" ariaLabel="Loading button"></cps-button>

<!-- Sizes: large | normal (default) | small | xsmall -->
<cps-button label="Large" size="large"></cps-button>
<cps-button label="Normal"></cps-button>
<cps-button label="Small" size="small"></cps-button>
<cps-button label="XSmall" size="xsmall"></cps-button>`,

    outlined: `
<cps-button label="Button" type="outlined" color="luxury"></cps-button>
<cps-button icon="add" label="Button with icon" type="outlined"></cps-button>
<cps-button icon="add" label="Button" type="outlined" color="surprise" iconPosition="after"></cps-button>
<cps-button label="Button" type="outlined" color="luxury" [disabled]="true"></cps-button>
<cps-button [loading]="true" type="outlined" ariaLabel="Loading button"></cps-button>`,

    borderless: `
<cps-button label="Button" type="borderless" color="luxury"></cps-button>
<cps-button icon="add" label="Button with icon" type="borderless"></cps-button>
<cps-button icon="add" label="Button" type="borderless" color="surprise" iconPosition="after"></cps-button>
<cps-button label="Button" type="borderless" color="luxury" [disabled]="true"></cps-button>
<cps-button [loading]="true" type="borderless" ariaLabel="Loading button"></cps-button>`,

    misc: `
<!-- Interactive loading state -->
<cps-button
  label="Click to load"
  type="outlined"
  color="white"
  [loading]="isLoading"
  (clicked)="onClickForLoading()">
</cps-button>

<!-- Icon-only -->
<cps-button color="white" type="outlined" icon="like" size="large" ariaLabel="Like"></cps-button>

<!-- Custom size -->
<cps-button label="Custom size" borderRadius="2rem" width="300" height="60" color="white" type="outlined" icon="avatar-top-menu"></cps-button>

<!-- Block / full-width -->
<cps-button label="Block large button" borderRadius="0" width="100%" size="large" color="depth"></cps-button>`
  };
}
