## Consumer Products UI Kit

### Angular shared components library

This repository consists of two projects:

- `cps-ui-kit` - shared components library itself
- `composition` - application for previewing compositions of components consumed from the library

#### Accessibility

This library's components and the composition app are tested for WCAG 2.2 AA compliance both with automated tooling ([axe-core](https://github.com/dequelabs/axe-core), via a Playwright test suite and pa11y-ci) and manual accessibility review. See [Run accessibility tests](#run-accessibility-tests) for how to run the automated checks yourself.

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

#### Run Playwright e2e tests

`npm run test:playwright` (headless run)

`npm run test:playwright:headed` to run tests in headed mode (browser visible)

`npm run test:playwright:interactive` to open Playwright UI mode

See [playwright/README.md](playwright/README.md) for full details.

#### Commit / PR title convention

Versioning and the changelog are driven by [Conventional Commits](https://www.conventionalcommits.org/). Because PRs are **squash-merged**, the **PR title** becomes the single commit on `master`, so the PR title is what must follow the convention (enforced by the `Check PR Title` workflow):

```text
<type>(<scope>): <subject>
```

**Type** determines the version bump and changelog section:

| Type                                                        | Bump      | Changelog                |
| ----------------------------------------------------------- | --------- | ------------------------ |
| `feat`                                                      | **minor** | Features                 |
| `fix`                                                       | **patch** | Bug Fixes                |
| `perf`                                                      | **patch** | Performance Improvements |
| `feat!` / `fix!` / `BREAKING CHANGE:` footer                | **major** | Breaking section         |
| `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore` | none      | hidden                   |

**Scope** _(optional)_ is the component the change targets, written as the component name **without the `cps-` prefix**. It only affects how the entry is grouped/labelled in the changelog (this is a single package, so the scope does not change versioning). Use the component name from the list above:

```text
feat(chip): add dismissible variant
fix(scheduler): correct keyboard navigation in month view
fix(tree-table): resolve a11y issue with row focus
```

Omit the scope for cross-cutting changes that don't map to a single component (theming, shared utilities, build, repo-wide a11y sweeps):

```text
chore: bump X package to v1.2.3
```

> There is intentionally **no fixed list of allowed scopes**: scope is free-form so new components don't require a CI change. Keep names consistent with the component directory (minus `cps-`).

#### Versioning and publishing

Publishing is fully automated by [Release Please](https://github.com/googleapis/release-please). **You never edit the version in `package.json` by hand.**

1. Merge feature/fix PRs to `master` as usual (squash merge, conventional title).
2. Release Please keeps an open **"release" PR** up to date, accumulating the next version bump and the generated `CHANGELOG.md` from the merged commits.
3. When you're ready to ship, **merge the release PR**. That tags the release and triggers the publish job, which builds and publishes to NPM via [trusted publishing (OIDC)](https://docs.npmjs.com/trusted-publishers), with no NPM token required.

The current released version is tracked in [`.release-please-manifest.json`](.release-please-manifest.json); Release Please updates both it and [`projects/cps-ui-kit/package.json`](projects/cps-ui-kit/package.json) inside the release PR.

#### Run accessibility tests

Accessibility is covered by two complementary tools, run separately and by different CI jobs:

**Playwright + axe-core** — scans individual `cps-ui-kit` components (in isolation) and the full `composition` app (pages, shell, interactive states) against WCAG 2.0/2.1/2.2 A/AA + best-practice rules.

```bash
npm run test:playwright:accessibility              # everything (cps-ui-kit + composition)
npm run test:playwright:cps-ui-kit:accessibility    # cps-ui-kit components only
npm run test:playwright:composition:accessibility   # composition app only
```

These run as part of the `playwright` CI job. See [playwright/README.md](playwright/README.md) for full details, including how component/page entries are structured.

**pa11y-ci** — scans all 33 composition demo pages (one per component) against WCAG 2.0 AA, using axe-core as its underlying test engine. This is a separate, independent check from the Playwright one above and runs as its own `pa11y` CI job.

To run it manually:

1. Start the development server:

   ```bash
   npm run start
   ```

2. In a separate terminal, run the accessibility tests:
   ```bash
   npm run test:pa11y
   ```

Alternatively, use the combined script that starts the server and shows a colorful summary with statistics:

```bash
npm run test:pa11y:local
```

`npm run test:pa11y:summary` produces that same summary, but assumes the server is already running.

`npm run test:pa11y:ci` is the CI equivalent of `test:pa11y:local` — it starts the server and runs the plain `test:pa11y` reporter (full per-URL violation output) instead of the summary. This is what the `pa11y` CI job runs.

The summary variants display:

- Total URLs tested with pass/fail ratio
- Total accessibility errors found
- Accessibility standard (WCAG 2.0 AA)
- Test engine (axe-core via pa11y-ci)
- Top 10 components with the most issues

Both `test:pa11y` and `test:pa11y:ci` fail (non-zero exit code) if any accessibility error is found on any page.

#### Third-party notices

`cps-ui-kit` vendors source code from [PrimeNG](https://github.com/primefaces/primeng) (MIT License) rather than depending on it as an npm package. See [NOTICE](./NOTICE) for details.
