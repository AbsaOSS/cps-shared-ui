/**
 * Vendored from primeuix (https://github.com/primefaces/primeuix, commit b9467bc448d35738d4f651dbc3caa4d4cb9a6a96).
 * Original file: packages/styled/src/helpers/t.ts
 * Modified: import paths rewritten to resolve locally. See ../../../NOTICE.md.
 * Original license: MIT, Copyright (c) 2025 PrimeTek.
 */
import { mergeKeys } from '../../../utils/src/object/index';
import Theme from '../config/index';

export const $t = (theme: any = {}) => {
    let { preset: _preset, options: _options } = theme;

    return {
        preset(value: any) {
            _preset = _preset ? mergeKeys(_preset, value) : value;

            return this;
        },
        options(value: any) {
            _options = _options ? { ..._options, ...value } : value;

            return this;
        },
        // features
        primaryPalette(primary: any) {
            const { semantic } = _preset || {};

            _preset = { ..._preset, semantic: { ...semantic, primary } };

            return this;
        },
        surfacePalette(surface: any) {
            const { semantic } = _preset || {};
            const lightSurface = surface && Object.hasOwn(surface, 'light') ? surface.light : surface;
            const darkSurface = surface && Object.hasOwn(surface, 'dark') ? surface.dark : surface;
            const newColorScheme = {
                colorScheme: {
                    light: { ...semantic?.colorScheme?.light, ...(!!lightSurface && { surface: lightSurface }) },
                    dark: { ...semantic?.colorScheme?.dark, ...(!!darkSurface && { surface: darkSurface }) }
                }
            };

            _preset = { ..._preset, semantic: { ...semantic, ...newColorScheme } };

            return this;
        },
        // actions
        define({ useDefaultPreset = false, useDefaultOptions = false } = {}) {
            return {
                preset: useDefaultPreset ? Theme.getPreset() : _preset,
                options: useDefaultOptions ? Theme.getOptions() : _options
            };
        },
        update({ mergePresets = true, mergeOptions = true } = {}) {
            const newTheme = {
                preset: mergePresets ? mergeKeys(Theme.getPreset(), _preset) : _preset,
                options: mergeOptions ? { ...Theme.getOptions(), ..._options } : _options
            };

            Theme.setTheme(newTheme);

            return newTheme;
        },
        use(options: any) {
            const newTheme = this.define(options);

            Theme.setTheme(newTheme);

            return newTheme;
        }
    };
};
