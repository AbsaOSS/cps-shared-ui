import {
  UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
  uwtIsApplePlatform,
  uwtMatchesShortcut,
  uwtShortcutLabel
} from './uwt-diagnostics-shortcut';

type Mods = Partial<
  Pick<KeyboardEvent, 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey' | 'repeat'>
>;

function key(code: string, mods: Mods, keyChar = '8', altGraph = false) {
  const event = new KeyboardEvent('keydown', { code, key: keyChar, ...mods });
  Object.defineProperty(event, 'getModifierState', {
    value: (k: string) => k === 'AltGraph' && altGraph
  });
  return event;
}

const [MAC, WIN] = UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS;
const macMods = { shiftKey: true, altKey: true, metaKey: true };
const winMods = { ctrlKey: true, altKey: true, shiftKey: true };

describe('uwtMatchesShortcut', () => {
  it('should match ⇧⌥⌘8, even though Option and Shift change the character', () => {
    // On macOS, ⇧⌥8 produces "°" — only the physical key is reliable.
    expect(uwtMatchesShortcut(key('Digit8', macMods, '°'), MAC)).toBe(true);
  });

  it('should match Ctrl+Alt+Shift+8', () => {
    expect(uwtMatchesShortcut(key('Digit8', winMods, '*'), WIN)).toBe(true);
  });

  it.each([
    ['a modifier missing', { shiftKey: true, altKey: true }],
    ['an extra modifier', { ...macMods, ctrlKey: true }],
    ['no modifiers', {}]
  ])('should not match with %s', (_label, mods) => {
    expect(uwtMatchesShortcut(key('Digit8', mods), MAC)).toBe(false);
  });

  it('should not match the numpad 8', () => {
    expect(uwtMatchesShortcut(key('Numpad8', macMods), MAC)).toBe(false);
  });

  it('should ignore a held-down repeat', () => {
    expect(
      uwtMatchesShortcut(key('Digit8', { ...winMods, repeat: true }), WIN)
    ).toBe(false);
  });

  it('should not fire while AltGr is producing a character', () => {
    // AltGr reports as Ctrl+Alt on many European Windows layouts.
    expect(uwtMatchesShortcut(key('Digit8', winMods, '8', true), WIN)).toBe(
      false
    );
  });

  it('should match a custom shortcut', () => {
    const custom = { code: 'KeyD', ctrl: true, alt: true, shift: true };
    expect(uwtMatchesShortcut(key('KeyD', winMods, 'D'), custom)).toBe(true);
    expect(uwtMatchesShortcut(key('Digit8', winMods), custom)).toBe(false);
  });
});

describe('uwtShortcutLabel', () => {
  it('should show the macOS label on Apple platforms, and the other elsewhere', () => {
    expect(uwtShortcutLabel(UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS, true)).toBe(
      '⇧⌥⌘8'
    );
    expect(uwtShortcutLabel(UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS, false)).toBe(
      'Ctrl+Alt+Shift+8'
    );
  });

  it('should describe a shortcut that has no label', () => {
    expect(
      uwtShortcutLabel([{ code: 'KeyD', ctrl: true, shift: true }], false)
    ).toBe('Ctrl+Shift+D');
  });

  it('should be undefined with no shortcuts', () => {
    expect(uwtShortcutLabel([], false)).toBeUndefined();
  });
});

describe('uwtIsApplePlatform', () => {
  it.each([
    ['MacIntel', true],
    ['iPad', true],
    ['Win32', false],
    ['Linux x86_64', false]
  ])('should read %s as %s', (platform, expected) => {
    expect(uwtIsApplePlatform({ platform } as Navigator)).toBe(expected);
  });

  it('should prefer userAgentData when present', () => {
    const nav = {
      platform: 'Win32',
      userAgentData: { platform: 'macOS' }
    } as unknown as Navigator;
    expect(uwtIsApplePlatform(nav)).toBe(true);
  });
});
