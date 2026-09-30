import { CpsDiagnosticsShortcut } from '../cps-diagnostics.models/cps-diagnostics.models';

/**
 * The default shortcuts: ⇧⌥⌘8 on macOS, Ctrl+Alt+Shift+8 on Windows and
 * Linux.
 *
 * Four keys so it is never pressed by accident, ending in a digit because
 * every layout has one. Both are active everywhere — the other platform's
 * combination is harmless, and covers external keyboards and remote
 * desktops. None is bound by Chrome, Safari, Edge or Firefox; ⌥⌘8 alone is
 * macOS Accessibility Zoom, which is why Shift is part of it.
 *
 * @group Utils
 */
export const CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS: readonly CpsDiagnosticsShortcut[] =
  [
    { code: 'Digit8', shift: true, alt: true, meta: true, label: '⇧⌥⌘8' },
    {
      code: 'Digit8',
      ctrl: true,
      alt: true,
      shift: true,
      label: 'Ctrl+Alt+Shift+8'
    }
  ];

/**
 * Whether `event` is exactly `shortcut`.
 *
 * - The physical key is compared (`code`), never the produced character —
 *   Option turns 8 into `•` on macOS, and Shift turns it into `*`.
 * - Every modifier must match; one left out must be up.
 * - Held-down repeats don't count.
 * - AltGr is rejected. On many European Windows layouts it reports as
 *   Ctrl+Alt, and typing an AltGr character must never open the popup.
 */
export function cpsMatchesShortcut(
  event: KeyboardEvent,
  shortcut: CpsDiagnosticsShortcut
): boolean {
  if (event.repeat || event.code !== shortcut.code) {
    return false;
  }
  if (event.getModifierState?.('AltGraph')) {
    return false;
  }
  return (
    event.ctrlKey === !!shortcut.ctrl &&
    event.altKey === !!shortcut.alt &&
    event.shiftKey === !!shortcut.shift &&
    event.metaKey === !!shortcut.meta
  );
}

/** Whether the platform is Apple's, for choosing which label to show. */
export function cpsIsApplePlatform(nav: Navigator | undefined): boolean {
  if (!nav) {
    return false;
  }
  const platform =
    (nav as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ??
    nav.platform ??
    '';
  return /mac|iphone|ipad/i.test(platform);
}

/**
 * The shortcut to show people: the one written for this platform when
 * there is one, otherwise the first configured.
 */
export function cpsShortcutLabel(
  shortcuts: readonly CpsDiagnosticsShortcut[],
  apple: boolean
): string | undefined {
  const preferred = shortcuts.find((s) => !!s.meta === apple);
  const chosen = preferred ?? shortcuts[0];
  return chosen ? (chosen.label ?? describeShortcut(chosen)) : undefined;
}

function describeShortcut(s: CpsDiagnosticsShortcut): string {
  const key = s.code.replace(/^Digit|^Key/, '');
  return [
    s.ctrl && 'Ctrl',
    s.alt && 'Alt',
    s.shift && 'Shift',
    s.meta && 'Meta',
    key
  ]
    .filter(Boolean)
    .join('+');
}
