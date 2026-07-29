export const iconsExamples: Record<string, { html: string; ts?: string }> = {
  basicUsage: {
    html: `
<cps-icon icon="like" size="normal" color="var(--cps-text-primary)"></cps-icon>`
  },

  customColorToken: {
    html: `
<cps-icon icon="warning" size="normal" color="error"></cps-icon>`
  },

  differentSizes: {
    html: `
<div class="icon-sizes-row">
  <cps-icon icon="star" size="xsmall"></cps-icon>
  <cps-icon icon="star" size="small"></cps-icon>
  <cps-icon icon="star" size="normal"></cps-icon>
  <cps-icon icon="star" size="large"></cps-icon>
</div>`
  }
};
