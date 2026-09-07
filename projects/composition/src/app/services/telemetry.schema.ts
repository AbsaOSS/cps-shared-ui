/**
 * This application's telemetry vocabulary.
 *
 * Scenario, step, logger and business event names are metric dimensions,
 * declared once here rather than as free text at each call site. Anything not
 * listed below is a compile error.
 */
declare module 'cps-telemetry' {
  interface CpsScenarioNames {
    /** A router navigation, from click to activated route. */
    'route-navigation': true;

    /** Reading and simulating server-side processing of an uploaded file. */
    'file-upload': true;

    /** A typeahead query against the demo autocomplete dataset. */
    'autocomplete-search': true;

    /** Simulated async validation of a selected autocomplete option. */
    'autocomplete-validate': true;

    /** Simulated server-side page fetch for a lazy-loaded table. */
    'table-page-load': true;
  }

  interface CpsScenarioSteps {
    /** Resolving and loading the lazy route chunk. */
    'resolve-route': true;

    /** Activating the resolved component. */
    activate: true;

    /** Simulated processing of an uploaded file's contents. */
    process: true;

    /** Fetching matching options for a typed query. */
    query: true;

    /** Simulated async validation of a selection. */
    validate: true;

    /** Fetching one page of table rows. */
    fetch: true;

    /**
     * Formatting one fetched table row for display. Runs once per row, so
     * it's timed as an {@link CpsScenario.aggregateStart}/
     * {@link CpsScenario.aggregateEnd} total rather than as its own step.
     */
    'format-row': true;
  }

  interface CpsLoggerNames {
    /** Application lifecycle and router navigation. */
    app: true;

    /** Route titles. */
    routing: true;

    /** The documentation site's own components. */
    docs: true;

    /** The file-upload demo page. */
    'file-upload': true;

    /** The autocomplete demo page. */
    autocomplete: true;
  }

  interface CpsBiEventNames {
    /** The user switched between light and dark theme. */
    theme_changed: true;

    /** The user changed one theme dimension, e.g. color or radius. */
    theme_option_changed: true;

    /** The user expanded or collapsed the navigation sidebar. */
    sidebar_toggled: true;

    /** The user typed a query into the sidebar's component search. */
    sidebar_searched: true;

    /** The user copied a component's code example. */
    code_copied: true;
  }
}

export {};
