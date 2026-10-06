import { UwtTelemetryObservedEvent } from '@absaoss-cps/ngx-ui-watchtower';
import {
  UwtDiagnosticsExport,
  UwtDiagnosticsFilterState,
  UwtDiagnosticsSectionId
} from '../uwt-diagnostics.models/uwt-diagnostics.models';

/** What the export needs to know beyond the events themselves. */
export interface UwtDiagnosticsExportContext {
  section: UwtDiagnosticsSectionId;
  startedAt: string;
  paused: boolean;
  app: UwtDiagnosticsExport['app'];
  session: UwtDiagnosticsExport['session'];
  userAgent: string;
  activeFilters: UwtDiagnosticsFilterState;
  count: UwtDiagnosticsExport['count'];
  now?: Date;
}

/**
 * One section's downloadable document: every event captured in it, in the
 * order they were handed over, regardless of the filters on screen.
 */
export function uwtBuildDiagnosticsExport(
  events: readonly UwtTelemetryObservedEvent[],
  context: UwtDiagnosticsExportContext
): UwtDiagnosticsExport {
  const now = (context.now ?? new Date()).toISOString();
  return {
    format: 'ngx-ui-watchtower-diagnostics',
    formatVersion: 1,
    section: context.section,
    exportedAt: now,
    capture: {
      startedAt: context.startedAt,
      endedAt: now,
      paused: context.paused
    },
    app: context.app,
    session: context.session,
    userAgent: context.userAgent,
    activeFilters: context.activeFilters,
    count: context.count,
    events: [...events].sort((a, b) => a.sequence - b.sequence)
  };
}

/**
 * `JSON.stringify` that never throws on a payload: a repeated reference
 * becomes `"[Circular]"`, and a `bigint` becomes its decimal text.
 */
export function uwtSafeStringify(value: unknown, indent?: number): string {
  const ancestors: object[] = [];
  return JSON.stringify(
    value,
    function (this: unknown, _key: string, v: unknown) {
      if (typeof v === 'bigint') {
        return v.toString();
      }
      if (v === null || typeof v !== 'object') {
        return v;
      }
      // `this` is the object holding v: unwind to it, then check for a loop.
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop();
      }
      if (ancestors.includes(v)) {
        return '[Circular]';
      }
      ancestors.push(v);
      return v;
    },
    indent
  );
}

/**
 * `ngx-ui-watchtower-diagnostics-<application>-<section>-<yyyyMMdd-HHmmss>.json`
 * — no session or user id, since the name ends up in folders and tickets.
 */
export function uwtDiagnosticsFilename(
  application: string,
  section: UwtDiagnosticsSectionId,
  at: Date
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-` +
    `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`;
  const app = application.replace(/[^a-z0-9._-]+/gi, '-') || 'app';
  return `ngx-ui-watchtower-diagnostics-${app}-${section}-${stamp}.json`;
}

/**
 * Saves `json` as a file through a temporary link. The browser may still
 * block it without telling the page, so the popup also offers copying.
 */
export function uwtDownloadJson(
  doc: Document,
  filename: string,
  json: string
): void {
  const url = URL.createObjectURL(
    new Blob([json], { type: 'application/json' })
  );
  const link = doc.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  doc.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Revoked after the click has been handed to the browser.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
