export const tooltipExamples: Record<string, { html: string; ts?: string }> = {
  tooltipPositions: {
    html: `
<cps-button
  cpsTooltip="Bottom tooltip"
  tooltipPosition="bottom"
  label="Bottom tooltip">
</cps-button>
<cps-button
  cpsTooltip="Left tooltip"
  tooltipPosition="left"
  label="Left tooltip">
</cps-button>
<cps-button
  cpsTooltip="Right tooltip"
  tooltipPosition="right"
  label="Right tooltip">
</cps-button>
<cps-button
  cpsTooltip="Top tooltip"
  tooltipPosition="top"
  label="Top tooltip">
</cps-button>`
  },

  openingMethods: {
    html: `
<cps-button
  label="Open on hover"
  tooltipPosition="bottom"
  cpsTooltip="Triggered on hover"
  tooltipOpenOn="hover">
</cps-button>
<cps-button
  label="Open on click"
  tooltipPosition="right"
  cpsTooltip="Triggered on click"
  tooltipOpenOn="click">
</cps-button>`
  },

  openCloseDelays: {
    html: `
<cps-button
  cpsTooltip="1 second open delay"
  label="Open delay"
  tooltipPosition="bottom"
  [tooltipOpenDelay]="1000">
</cps-button>
<cps-button
  cpsTooltip="1 second close delay"
  label="Close delay"
  tooltipPosition="right"
  [tooltipCloseDelay]="1000">
</cps-button>`
  },

  persistentHtmlTooltip: {
    html: `
<cps-button
  cpsTooltip="<span class='ttip-hdr'>Follow the link</span> <a href='https://www.google.com/' target='_blank' rel='noopener noreferrer'>Google</a> <a href='https://www.bing.com/' target='_blank' rel='noopener noreferrer'>Bing</a>"
  tooltipPosition="right"
  tooltipContentClass="my-tooltip-content"
  label="Tooltip with clickable content"
  [tooltipPersistent]="true">
</cps-button>`
  },

  disabledTooltipState: {
    html: `
<cps-button
  tooltipPosition="bottom"
  [label]="ttipEnabled ? 'Enabled tooltip' : 'Disabled tooltip'"
  [tooltipDisabled]="!ttipEnabled"
  cpsTooltip="<span><strong>Some bold text</strong></span>">
</cps-button>
<cps-checkbox
  [(ngModel)]="ttipEnabled"
  [label]="ttipEnabled ? 'Deactivate' : 'Activate'"></cps-checkbox>`,
    ts: `
ttipEnabled = false;`
  }
};
