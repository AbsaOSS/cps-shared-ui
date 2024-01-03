## Consumer Products UI Kit

### Shared components library

This repository consists of two projects:

- cps-ui-kit - shared components library itself
- composition - application for previewing compositions of components consumed from the library

#### Available components

- Autocomplete
- Button
- Button toggles
- Checkbox
- Chip
- Datepicker
- Dialog
- Expansion panel
- Icon
- Info circle
- Input
- Loader
- Menu
- Paginator
- Progress circular (indeterminate)
- Progress linear (indeterminate)
- Radio
- Select
- Sidebar menu
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

- go to projects/cps-ui-kit/src/lib/components directory
- run: ng g c cps-componentname --standalone --prefix
- modify projects/cps-ui-kit/src/public-api.ts to export the component from the library
- update available components list in projects/cps-ui-kit/README.md (keep alphabetical order!)

Make sure 'ng build cps-ui-kit --watch' is running, so the library will be rebuilt on each change of its contents due to --watch flag

#### Create a composition page

- go to projects/composition/src/app/pages directory
- run: ng g c componentname-page --standalone
- there is no need to test composition pages, so manually delete componentname-page.cy.ts file (can't be done automatically with Angular CLI flag, since cypress is used)
- provide host: { class: 'composition-page' } into page @Component
- import the components for the composition page from 'cps-ui-kit', provide them to imports array of @Component
- go to projects/composition/src/app/components/navigation-sidebar.component.ts file and extend \_components array (keep alphabetical order!)
- go to projects/composition/src/app/app-routing.module.ts and add a new route for a new page
- update available components list in README.md (keep alphabetical order!)
