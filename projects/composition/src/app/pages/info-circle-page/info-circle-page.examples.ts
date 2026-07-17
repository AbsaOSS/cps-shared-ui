export const infoCircleExamples: Record<string, { html: string; ts?: string }> =
  {
    xsmallTopTooltip: {
      html: `
<cps-info-circle
  size="xsmall"
  tooltipPosition="top"
  tooltipText="Provide any information here"></cps-info-circle>`
    },

    smallRightTooltip: {
      html: `
<cps-info-circle
  size="small"
  tooltipPosition="right"
  tooltipText="Provide any information here"></cps-info-circle>`
    },

    normalLeftTooltip: {
      html: `
<cps-info-circle
  size="normal"
  tooltipPosition="left"
  tooltipText="Provide any information here"></cps-info-circle>`
    },

    largeBottomTooltip: {
      html: `
<cps-info-circle
  size="large"
  tooltipPosition="bottom"
  tooltipText="Provide any information here"></cps-info-circle>`
    }
  };
