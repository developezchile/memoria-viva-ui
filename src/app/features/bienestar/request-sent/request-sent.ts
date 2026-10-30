import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WellnessStore } from '../../../core/services/wellness';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { SpecialistPhoto } from '../specialist-photo';

/** Confirmación de la solicitud de contacto a un especialista. */
@Component({
  selector: 'mv-request-sent',
  imports: [RouterLink, Header, Icon, SpecialistPhoto],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 32px 16px calc(var(--nav-h) + 24px); display: flex; flex-direction: column; align-items: center; text-align: center; }
    .check {
      display: flex; align-items: center; justify-content: center;
      width: 96px; height: 96px; border-radius: 50%; background: var(--verde);
      box-shadow: 0 0 0 10px rgba(115, 123, 76, 0.15);
      animation: pop 0.35s ease-out;
    }
    h2 { margin-top: 28px; font-family: var(--font-titulo); font-size: 1.5rem; color: var(--madera); }
    .msg { margin-top: 8px; max-width: 300px; font-size: 0.9375rem; line-height: 1.55; color: var(--casa); }
    .summary { display: flex; align-items: center; gap: 14px; width: 100%; margin-top: 24px; border-radius: 16px; text-align: left; }
    .summary .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .summary strong { font-weight: 600; color: var(--madera); }
    .summary small { font-size: 0.8125rem; color: var(--texto-sec); }
    .slot { display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 0.875rem; font-weight: 600; color: var(--verde); }
    .emotive { margin-top: 24px; font-size: 1.375rem; }
    .actions { width: 100%; margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
    a.btn-primary { text-decoration: none; }
    .btn-link { align-self: center; }
    @keyframes pop { from { transform: scale(0.6); opacity: 0; } }
  `,
  template: `
    <mv-header title="Solicitud enviada" />
    <div class="screen-body with-nav">
      <div class="check" aria-hidden="true"><mv-icon name="check" [size]="48" color="#FFFFFF" /></div>
      <h2>¡Listo!</h2>
      <p class="msg" role="status">
        Tu solicitud ha sido enviada. {{ specialist()?.name ?? 'El especialista' }} te contactará pronto.
      </p>

      @if (specialist(); as s) {
        <div class="card summary">
          <mv-specialist-photo [specialist]="s" [size]="56" />
          <span class="grow">
            <strong>{{ s.name }}</strong>
            <small>{{ s.title }} · {{ s.modality.join(' · ') }}</small>
            @if (horario()) {
              <span class="slot"><mv-icon name="clock" [size]="14" color="#737B4C" /> Horario elegido: {{ horario() }}</span>
            }
          </span>
        </div>
      }

      <p class="emotive">Pedir ayuda es un acto de amor propio.</p>

      <div class="actions">
        <a class="btn-primary" routerLink="/familia">Volver al inicio</a>
        <a class="btn-link" routerLink="/bienestar/especialistas">Ver otros especialistas</a>
      </div>
    </div>
  `,
})
export class RequestSent {
  private readonly store = inject(WellnessStore);

  /** Query `?especialista=&horario=`. */
  readonly especialista = input<string>();
  readonly horario = input<string>();

  protected readonly specialist = computed(() => {
    const id = this.especialista();
    return id ? this.store.specialist(id) : undefined;
  });
}
