export type A11yImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export type A11yCategory =
  | 'axe'
  | 'focus-order'
  | 'headings'
  | 'landmarks'
  | 'link-text'
  | 'interactive';

export interface A11yIssue {
  id: string;
  category: A11yCategory;
  element: HTMLElement;
  selector: string;
  impact: A11yImpact;
  message: string;
  helpUrl?: string;
  wcagTags?: string[];
}

const IMPACT_SEVERITY: Record<A11yImpact, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
};

export function worstImpact(impacts: A11yImpact[]): A11yImpact {
  return impacts.reduce((worst, current) =>
    IMPACT_SEVERITY[current] > IMPACT_SEVERITY[worst] ? current : worst
  );
}

/** One highlight per element, grouping all issues that share the same DOM element. */
export interface ElementHighlight {
  element: HTMLElement;
  impact: A11yImpact;
  issues: A11yIssue[];
  /** The primary issue (most severe) — used as the representative. */
  primary: A11yIssue;
}
