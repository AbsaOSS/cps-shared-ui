import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import {
  CPS_DEFAULT_EVENT_NAMESPACE,
  CPS_TELEMETRY_IDENTITY,
  CpsTelemetrySink
} from 'cps-telemetry';
import { CPS_LIVE_ANNOUNCER_SERVICE, CpsNotificationService } from 'cps-ui-kit';
import { CpsDiagnosticsSectionId } from '../cps-diagnostics.models/cps-diagnostics.models';
import { CpsDiagnosticsStore } from '../cps-diagnostics-store/cps-diagnostics-store';
import {
  cpsBuildDiagnosticsExport,
  cpsDiagnosticsFilename,
  cpsDownloadJson,
  cpsSafeStringify
} from './cps-diagnostics-export';

/** What each section calls its events, when telling people about them. */
export const CPS_DIAGNOSTICS_SECTION_NOUN: Record<
  CpsDiagnosticsSectionId,
  string
> = { bi: 'BI', scenario: 'scenario', logging: 'log' };

/**
 * Downloads or copies one section's captured events as JSON. Provided by
 * the popup, beside its {@link CpsDiagnosticsStore}.
 */
@Injectable()
export class CpsDiagnosticsExporter {
  private readonly store = inject(CpsDiagnosticsStore);
  private readonly identity = inject(CPS_TELEMETRY_IDENTITY, {
    optional: true
  });

  private readonly sink = inject(CpsTelemetrySink, { optional: true });
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(CPS_LIVE_ANNOUNCER_SERVICE, {
    optional: true
  });

  private readonly notifications = inject(CpsNotificationService, {
    optional: true
  });

  /** Saves the section's events as a JSON file. */
  download(section: CpsDiagnosticsSectionId): void {
    try {
      const json = this.json(section);
      cpsDownloadJson(
        this.document,
        cpsDiagnosticsFilename(
          this.identity?.application ?? 'app',
          section,
          new Date()
        ),
        json
      );
      this.announce(
        `Downloaded ${this.store.sectionCount(section).captured} ${
          CPS_DIAGNOSTICS_SECTION_NOUN[section]
        } events.`
      );
    } catch (error) {
      this.fail("Couldn't create the download", error);
    }
  }

  /**
   * Puts the section's events on the clipboard, for when a browser blocks
   * downloads.
   *
   * @returns whether copying worked
   */
  async copy(section: CpsDiagnosticsSectionId): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.json(section));
      this.announce(
        `${CPS_DIAGNOSTICS_SECTION_NOUN[section]} events copied as JSON.`
      );
      return true;
    } catch (error) {
      this.fail("Couldn't copy to the clipboard", error);
      return false;
    }
  }

  /** The section's export document, serialized. */
  json(section: CpsDiagnosticsSectionId): string {
    return cpsSafeStringify(
      cpsBuildDiagnosticsExport(this.store.sectionEvents(section), {
        section,
        startedAt: this.store.startedAt(),
        paused: this.store.paused(),
        app: {
          application: this.identity?.application ?? '',
          environment: this.identity?.environment ?? '',
          version: this.identity?.version ?? '',
          eventNamespace:
            this.identity?.eventNamespace ?? CPS_DEFAULT_EVENT_NAMESPACE
        },
        session: this.session(),
        userAgent: this.document.defaultView?.navigator.userAgent ?? '',
        activeFilters: this.store.filters()[section],
        count: this.store.sectionCount(section)
      }),
      2
    );
  }

  private session(): { sessionId?: string; userId?: string } {
    try {
      return {
        sessionId: this.sink?.getSessionId(),
        userId: this.sink?.getUserId()
      };
    } catch {
      return {};
    }
  }

  private announce(message: string): void {
    try {
      this.announcer?.announce(message, 'polite');
    } catch {
      // Announcements are a courtesy; never let one break the popup.
    }
  }

  private fail(message: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    try {
      this.notifications?.error(message, detail);
    } catch {
      // Nothing more to do; the popup keeps working.
    }
  }
}
