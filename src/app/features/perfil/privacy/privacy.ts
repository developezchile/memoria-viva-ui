import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DEFAULT_SETTINGS, Settings } from '../../../core/data/models';
import { Session } from '../../../core/services/session';
import { SettingsStore } from '../../../core/services/settings';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon, IconName } from '../../../shared/icon';
import { Toggle } from '../../../shared/toggle';

type PrivacyKey = 'privateProfile' | 'showMoodToFamily' | 'notifications';

const OPTIONS: { key: PrivacyKey; icon: IconName; label: string; help: string }[] = [
  {
    key: 'privateProfile', icon: 'lock', label: 'Perfil privado',
    help: 'Tus publicaciones y estadísticas solo las verás tú en tu perfil.',
  },
  {
    key: 'showMoodToFamily', icon: 'heart', label: 'Compartir mi estado de ánimo',
    help: 'Tu familia podrá ver tu último estado para acompañarte. Tu diario siempre es privado.',
  },
  {
    key: 'notifications', icon: 'bell', label: 'Notificaciones',
    help: 'Avisos de nuevas publicaciones, fechas especiales y mensajes que se abren.',
  },
];

/** Privacidad y seguridad: interruptores de perfil y cambio de contraseña. */
@Component({
  selector: 'mv-privacy',
  imports: [Header, Icon, Toggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; display: flex; flex-direction: column; gap: 24px; }
    .group { padding: 0; border-radius: 16px; overflow: hidden; }
    .opt { align-items: flex-start; cursor: pointer; }
    .ico {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 10px; background: var(--crema); flex-shrink: 0;
    }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .grow strong { font-size: 0.9375rem; font-weight: 600; }
    .grow small { font-size: 0.75rem; line-height: 1.4; color: var(--texto-sec); }
    .form { display: flex; flex-direction: column; gap: 16px; border-radius: 16px; }
    .hint { margin-top: 6px; font-size: 0.75rem; color: var(--texto-sec); }
    .safe { display: flex; gap: 8px; font-size: 0.75rem; line-height: 1.5; color: var(--texto-sec); }
  `,
  template: `
    <mv-header title="Privacidad y seguridad" back="/perfil/configuracion" />

    <div class="screen-body with-nav">
      <div class="content">
        <section>
          <h2 class="section-title">Privacidad</h2>
          <div class="card group">
            @for (o of options; track o.key) {
              <!-- El <label> nombra el interruptor (botón) que contiene -->
              <label class="list-row opt">
                <span class="ico"><mv-icon [name]="o.icon" [size]="18" /></span>
                <span class="grow">
                  <strong>{{ o.label }}</strong>
                  <small>{{ o.help }}</small>
                </span>
                <mv-toggle [on]="settings()[o.key]" (onChange)="toggle(o.key, $event)" />
              </label>
            }
          </div>
        </section>

        <section>
          <h2 class="section-title">Cambiar contraseña</h2>
          <form class="card form" (submit)="$event.preventDefault(); changePassword()" novalidate>
            <div>
              <label class="field-label" for="pw-current">Contraseña actual</label>
              <input id="pw-current" class="input" type="password" autocomplete="current-password"
                [value]="current()" (input)="current.set($any($event.target).value); serverError.set('')" />
              @if (tried() && errors().current) {
                <p class="error-text">{{ errors().current }}</p>
              } @else if (serverError()) {
                <p class="error-text">{{ serverError() }}</p>
              }
            </div>
            <div>
              <label class="field-label" for="pw-new">Nueva contraseña</label>
              <input id="pw-new" class="input" type="password" autocomplete="new-password"
                [value]="next()" (input)="next.set($any($event.target).value)" />
              @if (tried() && errors().next) {
                <p class="error-text">{{ errors().next }}</p>
              } @else {
                <p class="hint">Mínimo 8 caracteres.</p>
              }
            </div>
            <div>
              <label class="field-label" for="pw-confirm">Confirmar nueva contraseña</label>
              <input id="pw-confirm" class="input" type="password" autocomplete="new-password"
                [value]="confirm()" (input)="confirm.set($any($event.target).value)" />
              @if (tried() && errors().confirm) {
                <p class="error-text">{{ errors().confirm }}</p>
              }
            </div>
            <button type="submit" class="btn-primary">Actualizar contraseña</button>
          </form>
        </section>

        <p class="safe">
          <mv-icon name="shield" [size]="16" color="#A89070" />
          Tus recuerdos se guardan en este dispositivo y solo tu familia puede verlos.
        </p>
      </div>
    </div>
  `,
})
export class Privacy {
  private readonly session = inject(Session);
  private readonly settingsStore = inject(SettingsStore);
  private readonly ui = inject(Ui);

  protected readonly options = OPTIONS;
  protected readonly settings = computed(() => ({ ...DEFAULT_SETTINGS, ...this.settingsStore.settings() }));

  protected readonly current = signal('');
  protected readonly next = signal('');
  protected readonly confirm = signal('');
  protected readonly tried = signal(false);
  protected readonly serverError = signal('');

  protected readonly errors = computed(() => {
    const e: Partial<Record<'current' | 'next' | 'confirm', string>> = {};
    if (!this.current()) e.current = 'Escribe tu contraseña actual.';
    if (this.next().length < 8) e.next = 'La nueva contraseña debe tener al menos 8 caracteres.';
    else if (this.next() === this.current()) e.next = 'La nueva contraseña debe ser distinta de la actual.';
    if (this.confirm() !== this.next()) e.confirm = 'Las contraseñas no coinciden.';
    return e;
  });

  protected toggle(key: PrivacyKey, on: Settings[PrivacyKey]): void {
    this.settingsStore.set(key, on);
    this.ui.toast('Preferencia guardada');
  }

  protected async changePassword(): Promise<void> {
    this.tried.set(true);
    if (Object.keys(this.errors()).length) return;
    try {
      await this.ui.withLoading('Actualizando…', () => this.session.changePassword(this.current(), this.next()));
    } catch (err) {
      this.serverError.set(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
      return;
    }
    this.current.set('');
    this.next.set('');
    this.confirm.set('');
    this.tried.set(false);
    this.ui.toast('Contraseña actualizada');
  }
}
