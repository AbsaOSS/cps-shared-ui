import { Injectable } from '@angular/core';
import { CPS_LOG_LEVEL_ORDER } from 'cps-telemetry';
import type {
  CpsLogApiProvider,
  CpsLogQuery,
  CpsLogRecord
} from 'cps-telemetry';

/** Records retained before the oldest are dropped. */
const BUFFER_LIMIT = 500;

/**
 * This application's in-memory log store.
 *
 * The telemetry library expects a backend to receive log records; this is
 * that backend for the documentation site. Records are held in a bounded
 * ring buffer and go nowhere — a real application replaces the body of
 * {@link send} with a call to its own log-ingestion endpoint.
 *
 * Read them from DevTools with `logger.query({ correlationId })`, or set
 * `localStorage.debugLogger = 'true'` to watch them arrive.
 */
@Injectable({ providedIn: 'root' })
export class AppLogApiProvider implements CpsLogApiProvider {
  private readonly buffer: CpsLogRecord[] = [];

  /** @inheritdoc */
  send(record: CpsLogRecord): void {
    this.buffer.push(record);
    if (this.buffer.length > BUFFER_LIMIT) {
      this.buffer.splice(0, this.buffer.length - BUFFER_LIMIT);
    }
  }

  /** @inheritdoc */
  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    let found = [...this.buffer];

    if (filter.correlationId) {
      found = found.filter((r) => r.correlationId === filter.correlationId);
    }
    if (filter.logger) {
      found = found.filter((r) => r.logger === filter.logger);
    }
    if (filter.minLevel) {
      const floor = CPS_LOG_LEVEL_ORDER[filter.minLevel];
      found = found.filter((r) => CPS_LOG_LEVEL_ORDER[r.level] >= floor);
    }
    if (filter.from) {
      const fromTime = new Date(filter.from).getTime();
      found = found.filter((r) => new Date(r.timestamp).getTime() >= fromTime);
    }
    if (filter.to) {
      const toTime = new Date(filter.to).getTime();
      found = found.filter((r) => new Date(r.timestamp).getTime() <= toTime);
    }
    if (filter.limit !== undefined) {
      found = found.slice(0, filter.limit);
    }

    return Promise.resolve(found);
  }

  /**
   * The retained records, oldest first. Synchronous, for inspection from
   * DevTools and tests.
   *
   * @returns a copy of the buffer
   */
  getRecords(): CpsLogRecord[] {
    return [...this.buffer];
  }

  /**
   * Saves the retained records to a file for download.
   *
   * @param filename the file to save as
   */
  download(filename = 'cps-logs.json'): void {
    if (
      typeof document === 'undefined' ||
      !document.body ||
      typeof Blob !== 'function' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return;
    }

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(this.buffer, undefined, 2)], {
        type: 'application/json'
      })
    );

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);

    try {
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }
}
