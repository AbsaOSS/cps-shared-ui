## Consumer Products UI Kit

### Angular shared components library

This repository consists of two projects:

- `cps-ui-kit` - shared components library itself
- `composition` - application for previewing compositions of components consumed from the library

#### Available components

- Autocomplete
- Button
- Button toggles
- Checkbox
- Chip
- Datepicker
- Dialog
- Divider
- Expansion panel
- File upload
- Icon
- Info circle
- Input
- Loader
- Menu
- Notifications
- Paginator
- Progress circular (indeterminate)
- Progress linear (indeterminate)
- Radio
- Scheduler
- Select
- Sidebar menu
- Switch
- Table
- Tabs
- Tag
- Textarea
- Timepicker
- Tooltip directive
- Tree autocomplete
- Tree select
- Tree table

## Development server

Run `ng build cps-ui-kit --watch` and `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Design guidelines

https://www.figma.com/file/JAlfp4zwZIONMWYPbLY4aM/Consumer-products-design-system?node-id=0%3A1&t=qVkCtHGgnZSpAYVp-1

## How-to

#### Create a new component

- go to `projects/cps-ui-kit/src/lib/components` directory
- run: `ng g c cps-componentname --standalone --prefix`
- modify `projects/cps-ui-kit/src/public-api.ts` to export the component from the library
- update available components list in `projects/cps-ui-kit/README.md` (keep alphabetical order!)

Make sure `ng build cps-ui-kit --watch` is running, so the library will be rebuilt on each change of its contents due to `--watch` flag

#### Create a composition page

- go to `projects/composition/src/app/pages` directory
- run: `ng g c componentname-page --standalone`
- there is no need to test composition pages, so manually delete `componentname-page.component.cy.ts` file (can't be done automatically with Angular CLI flag, since cypress is used)
- provide `host: { class: 'composition-page' }` into page `@Component`
- import the components for the composition page from `cps-ui-kit`, provide them to imports array of `@Component`
- include `ComponentDocsViewerComponent` into `@Component` `imports` array in case of a new component page, include `ServiceDocsViewerComponent` into `@Component` `imports` array in case of a new service page
- import `ComponentData or ServiceData` from '../../api-data/cps-componentname.json' once it is generated
- wrap page html template contents into `<app-component-docs-viewer [componentData]="componentData">...</app-component-docs-viewer>` in case of a new component page, wrap page html template contents into `<app-service-docs-viewer [serviceData]="serviceData">...</app-service-docs-viewer>` in case of a new service page
- go to `projects/composition/src/app/components/navigation-sidebar.component.ts` file and extend `_components` array (keep alphabetical order!)
- go to `projects/composition/src/app/app-routing.module.ts` and add a new route for a new page
- update available components list in `/README.md` (keep alphabetical order!)

#### Generate API documentation

Execute `npm run generate-json-api` to generate documentation for any changes in the components' API.

#### Run Jest unit tests

`npm run test`


#### Run Cypress e2e tests

`npm run cypress:run` (headless run) or you can open Cypress tests using `npm run cypress:open`

#### Run accessibility tests

The project uses [pa11y-ci](https://github.com/pa11y/pa11y-ci) to test all components for WCAG 2.0 AA compliance.

To run accessibility tests:

1. Start the development server:
   ```bash
   npm run start
   ```

2. In a separate terminal, run the accessibility tests:
   ```bash
   npm run test:a11y
   ```

Alternatively, use the combined script that starts the server and runs tests:
```bash
npm run test:a11y:local
```

For a colorful summary with statistics:
```bash
npm run test:a11y:summary
```

This will display:
- Total components tested and pass/fail counts
- Total accessibility errors found
- Top 10 components with the most issues

The tests will check all 33 components for accessibility issues and report any violations found.
