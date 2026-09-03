export const paginatorExamples: Record<string, { html: string; ts?: string }> =
  {
    basicUsage: {
      html: `
<cps-paginator
  ariaLabel="Basic pagination"
  [first]="first"
  [rows]="rows"
  [totalRecords]="120"
  (pageChanged)="onPageChanged($event)">
</cps-paginator>`,
      ts: `
first = 0;
rows = 10;

onPageChanged(event: { first: number; rows: number }) {
  this.first = event.first;
  this.rows = event.rows;
}`
    },

    singlePage: {
      html: `
<cps-paginator
  ariaLabel="Single-page pagination"
  [first]="0"
  [rows]="10"
  [totalRecords]="manyRecords ? 120 : 5"
  [alwaysShow]="false">
</cps-paginator>
<cps-switch
  [(ngModel)]="manyRecords"
  label="Load enough records for multiple pages">
</cps-switch>`,
      ts: `
manyRecords = false;`
    },

    customRowsPerPage: {
      html: `
<cps-paginator
  ariaLabel="Custom rows-per-page pagination"
  [first]="0"
  [rows]="5"
  [totalRecords]="120"
  [rowsPerPageOptions]="[5, 15, 30]"
  [resetPageOnRowsChange]="true">
</cps-paginator>`
    },

    customBackground: {
      html: `
<cps-paginator
  ariaLabel="Custom background pagination"
  backgroundColor="#f0f4ff"
  [rows]="10"
  [totalRecords]="120">
</cps-paginator>`
    }
  };
