import { A11yIssue } from '../models/a11y-issue.model';

export interface Scanner {
  scan(root: HTMLElement): Promise<A11yIssue[]>;
}
