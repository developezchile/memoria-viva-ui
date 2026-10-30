import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DEFAULT_SETTINGS } from '../../../core/data/models';
import { SettingsStore } from '../../../core/services/settings';
import { Header } from '../../../shared/header';
import { Icon, IconName } from '../../../shared/icon';
import { Toggle } from '../../../shared/toggle';

type A11yKey = 'highContrast' | 'zoom' | 'screenReader' | 'reduceMotion';

const OPTIONS: { key: A11yKey; icon: IconName; label: string; help: string }[] = [
  { key: 'highContrast', icon: 'sun', label: 'Alto contraste', help: 'Textos y bordes más oscuros para leer mejor.' },
  { key: 'zoom', icon: 'search', label: 'Zoom', help: 'Agranda botones y textos en toda la app.' },
  { key: 'screenReader', icon: 'volume', label: 'Lector de pantalla', help: 'Optimiza la app para lectores de voz.' },
  { key: 'reduceMotion', icon: 'pause', label: 'Reducir movimiento', help: 'Desactiva animaciones y transiciones.' },
];

const MIN = 0.9;
const MAX = 1.4;
const STEP = 0.1;

/** Accesibilidad: tamaño de fuente, contraste, zoom, lector y movimiento. Se aplica al instante. */
@Component({
  selector: 'mv-accessibility',
  imports: [Header, Icon, Toggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; display: flex; flex-direction: column; gap: 24px; }
    .font-card { display: flex; flex-direction: column; gap: 12px; border-radius: 16px; }
    .font-head { display: flex; align-items: center; justify-content: space-between; }
    .font-head .field-label { margin: 0; }
    .pct { font-size: 0.875rem; font-weight: 600; color: var(--verde); }
    .range { display: flex; align-items: center; gap: 12px; }
    .range .a { font-family: var(--font-titulo); color: var(--texto-sec); }
    .range .a.small { font-size: 0.875rem; }
    .range .a.big { font-size: 1.375rem; }
    .slider-input { flex: 1; height: 6px; }
    .sample {
      padding: 12px 16px; border-radius: 12px; background: var(--fondo);
      font-size: 1rem; line-height: 1.5; color: var(--madera);
    }
    .sample .emotive { display: block; font-size: 1.375rem; }
    .reset { align-self: flex-end; }
    .group { padding: 0; border-radius: 16px; overflow: hidden; }
    .opt { align-items: flex-start; cursor: pointer; }
    .ico {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 10px; background: var(--crema); flex-shrink: 0;
    }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .grow strong { font-size: 0.9375rem; font-weight: 600; }
    .grow small { font-size: 0.75rem; line-height: 1.4; color: var(--texto-sec); }
    .sr-hint {
      display: flex; gap: 10px; padding: 12px 16px; border-radius: 12px;
      background: rgba(115, 123, 76, 0.1); font-size: 0.8125rem; line-height: 1.5; color: var(--madera);
    }
  `,
  template: `
    <mv-header title="Accesibilidad" back="/perfil/configuracion" />

    <div class="screen-body with-nav">
      <div class="content">
        <section class="card font-card">
          <div class="font-head">
            <label class="field-label" for="font-range">Tamaño de la letra</label>
            <span class="pct">{{ percent() }}%</span>
          </div>
          <div class="range">
            <span class="a small" aria-hidden="true">A</span>
            <input
              id="font-range"
              type="range"
              class="slider-input"
              [min]="min"
              [max]="max"
              [step]="step"
              [value]="fontScale()"
              [style.background]="track()"
              [attr.aria-valuetext]="percent() + ' por ciento'"
              (input)="setScale($any($event.target).value)"
            />
            <span class="a big" aria-hidden="true">A</span>
          </div>
          <p class="sample" aria-live="polite">
            <span class="emotive">Los recuerdos nos acompañan.</span>
            Así se verán los textos en toda la aplicación.
          </p>
          @if (fontScale() !== 1) {
            <button type="button" class="btn-link reset" (click)="setScale(1)">Restablecer tamaño</button>
          }
        </section>

        <section>
          <h2 class="section-title">Visualización y lectura</h2>
          <div class="card group">
            @for (o of options; track o.key) {
              <!-- El <label> nombra el interruptor (botón) que contiene -->
              <label class="list-row opt">
                <span class="ico"><mv-icon [name]="o.icon" [size]="18" /></span>
                <span class="grow">
                  <strong>{{ o.label }}</strong>
                  <small>{{ o.help }}</small>
                </span>
                <mv-toggle [on]="settings()[o.key]" (onChange)="store.set(o.key, $event)" />
              </label>
            }
          </div>
        </section>

        @if (settings().screenReader) {
          <p class="sr-hint" role="status">
            <mv-icon name="volume" [size]="18" color="#737B4C" />
            <span>
              Memoria Viva es compatible con el lector de tu dispositivo (VoiceOver en iPhone o TalkBack en Android).
              Actívalo desde los ajustes de accesibilidad de tu teléfono.
            </span>
          </p>
        }
      </div>
    </div>
  `,
})
export class Accessibility {
  protected readonly store = inject(SettingsStore);

  protected readonly options = OPTIONS;
  protected readonly min = MIN;
  protected readonly max = MAX;
  protected readonly step = STEP;

  protected readonly settings = computed(() => ({ ...DEFAULT_SETTINGS, ...this.store.settings() }));
  protected readonly fontScale = computed(() => this.settings().fontScale);
  protected readonly percent = computed(() => Math.round(this.fontScale() * 100));
  protected readonly track = computed(() => {
    const pct = ((this.fontScale() - MIN) / (MAX - MIN)) * 100;
    return `linear-gradient(to right, var(--verde) ${pct}%, var(--borde) ${pct}%)`;
  });

  protected setScale(value: number | string): void {
    // Redondeo a un decimal para evitar 1.2000000000000002
    const v = Math.min(MAX, Math.max(MIN, Math.round(Number(value) * 10) / 10));
    this.store.set('fontScale', v);
  }
}
