import { Injectable } from '@angular/core';
import type {
  CpsRumBootstrap,
  CpsRumCredentialsProvider
} from 'cps-telemetry/rum';

/**
 * Shape returned by the backend RUM broker.
 */
interface RumInitResponse {
  enabled: boolean;
  config?: {
    applicationId: string;
    region: string;
    sessionSampleRate: number;
    applicationVersion: string;
  };
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: string;
  };
}

/**
 * Supplies CloudWatch RUM settings and credentials from this application's
 * backend broker.
 *
 * The backend vends short-lived credentials, so the browser never holds a
 * long-lived AWS identity.
 */
@Injectable({ providedIn: 'root' })
export class AppRumCredentialsProvider implements CpsRumCredentialsProvider {
  /**
   * Fetches the current app monitor settings and credentials.
   *
   * @returns the bootstrap payload, or `null` when RUM is switched off for this
   *   deployment or the broker is unreachable
   */
  async load(): Promise<CpsRumBootstrap | null> {
    let response: Response;
    try {
      response = await fetch('/rum/init', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
    } catch {
      // A network-level failure (offline, DNS, connection refused, ...)
      // rejects before any response exists — treat it the same as an
      // unreachable broker, per this method's own documented contract.
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const init = (await response.json()) as RumInitResponse;

    // Credentials are required: without them the client would start and then
    // fail every dispatch silently.
    if (!init?.enabled || !init.config || !init.credentials) {
      return null;
    }

    return {
      config: {
        applicationId: init.config.applicationId,
        region: init.config.region,
        applicationVersion: init.config.applicationVersion,
        sessionSampleRate: init.config.sessionSampleRate
      },
      credentials: init.credentials
    };
  }
}
