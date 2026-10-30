import { DOCUMENT, Injectable, effect, inject } from '@angular/core';

import { DEFAULT_SETTINGS, Settings } from '../data/models';
import { persisted } from '../data/storage';

/** Preferencias de privacidad y accesibilidad. Se aplican al documento al cambiar. */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly doc = inject(DOCUMENT);
  readonly settings = persisted<Settings>('settings', () => DEFAULT_SETTINGS);

  constructor() {
    effect(() => {
      const s = { ...DEFAULT_SETTINGS, ...this.settings() };
      const root = this.doc.documentElement;
      root.style.setProperty('--font-scale', String(s.fontScale));
      root.classList.toggle('high-contrast', s.highContrast);
      root.classList.toggle('zoom', s.zoom);
      root.classList.toggle('reduce-motion', s.reduceMotion);
    });
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings.update(s => ({ ...s, [key]: value }));
  }
}
