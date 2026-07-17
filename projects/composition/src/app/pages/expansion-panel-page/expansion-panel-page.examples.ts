export const expansionPanelExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  borderedTransparentBackground: {
    html: `
<cps-expansion-panel
  headerTitle="Bordered panel with transparent background">
  <div>
    <cps-button label="Sample button"></cps-button>
  </div>
</cps-expansion-panel>`
  },

  disabledPanel: {
    html: `
<cps-expansion-panel headerTitle="Disabled panel" [disabled]="true">
  <div>Some content</div>
</cps-expansion-panel>`
  },

  expandedWithPrefixIcon: {
    html: `
<cps-expansion-panel
  headerTitle="Bordered panel with prefix icon and transparent background"
  [isExpanded]="true"
  prefixIcon="construction">
  <div>Some content</div>
</cps-expansion-panel>`
  },

  borderlessWhiteBackground: {
    html: `
<cps-expansion-panel
  headerTitle="Borderless panel with white background"
  backgroundColor="white"
  [bordered]="false">
  <div>Some content</div>
</cps-expansion-panel>`
  },

  noChevronWithRadius: {
    html: `
<cps-expansion-panel
  headerTitle="Bordered panel with 0.25rem border radius without chevron"
  [showChevron]="false"
  backgroundColor="white"
  borderRadius="0.25rem">
  <div>Some content</div>
</cps-expansion-panel>`
  },

  customRadiusAndWidth: {
    html: `
<cps-expansion-panel
  headerTitle="Bordered panel with 0.25rem border radius and 32rem width"
  backgroundColor="white"
  borderRadius="0.25rem"
  width="32rem">
  <div>Some content</div>
</cps-expansion-panel>`
  }
};
