export const dividerExamples: Record<string, { html: string; ts?: string }> = {
  horizontalDivider: {
    html: `
<p>First row</p>
<cps-divider></cps-divider>
<p>Second row</p>`
  },

  verticalDivider: {
    html: `
<div style="display: flex; column-gap: 0.75rem;">
  <p>First column</p>
  <cps-divider [vertical]="true"></cps-divider>
  <p>Second column</p>
  <cps-divider [vertical]="true"></cps-divider>
  <p>Third column</p>
</div>`
  },

  dashedThickRedDivider: {
    html: `
<p>First row</p>
<cps-divider thickness="0.25rem" color="red" type="dashed"></cps-divider>
<p>Second row</p>`
  }
};
