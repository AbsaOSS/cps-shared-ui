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
- Expansion panel
- Icon
- Input
- Loader
- Progress circular (indeterminate)
- Progress linear (indeterminate)
- Radio
- Select
- Tag
- Textarea
- Tree autocomplete
- Tree select

## Development server

Run `ng build cps-ui-kit --watch` and `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Design guidelines

https://www.figma.com/file/JAlfp4zwZIONMWYPbLY4aM/Consumer-products-design-system?node-id=0%3A1&t=qVkCtHGgnZSpAYVp-1

## How-to

#### Create a new component

- go to projects/cps-ui-kit/src/lib/components directory
- run: ng g c cps-componentname --standalone --prefix
- modify projects/cps-ui-kit/src/public-api.ts to export the component from the library

Make sure you have 'ng build cps-ui-kit --watch' running, so the library will be rebuilt on each change of its contents due to --watch flag

#### Create a composition page

- go to projects/composition/src/app/pages directory
- run: ng g c componentname-page --standalone
- we don't want to test composition pages, so manully delete componentname-page.cy.ts file (can't be done automatically with Angular CLI flag, since we use cypress)
- provide host: { class: 'composition-page' } to @Component decorator
- import the components for the composition page from 'cps-ui-kit', provide them to imports array of @Component
- go to projects/composition/src/app/components/navigation-sidebar.ts file and extend \_components array (keep alphabetical order!)
- go to projects/composition/src/app/app-routing.module.ts and add a new route for a new page
