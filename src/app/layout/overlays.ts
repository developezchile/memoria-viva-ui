import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Ui } from '../core/services/ui';
import { Icon } from '../shared/icon';
import { Sheet } from '../shared/sheet';

/** Capas globales: aviso (toast), carga, confirmación y sin conexión. */
@Component({
  selector: 'mv-overlays',
  imports: [Icon, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .toast {
      position: absolute; left: 16px; right: 16px; bottom: calc(var(--nav-h) + 16px); z-index: 60;
      padding: 12px 16px; border-radius: 12px;
      background: var(--madera); color: var(--crema);
      font-size: 0.875rem; text-align: center;
      box-shadow: 0 8px 24px rgba(26, 18, 8, 0.25);
      animation: rise 0.2s ease-out;
    }
    .loading {
      position: absolute; inset: 0; z-index: 70;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
      background: rgba(245, 240, 232, 0.82); backdrop-filter: blur(2px);
      font-size: 0.9375rem; color: var(--madera);
    }
    .spinner {
      width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid var(--borde); border-top-color: var(--verde);
      animation: spin 0.9s linear infinite;
    }
    .confirm-msg { font-size: 0.9375rem; line-height: 1.5; color: var(--texto-sec); }
    .btn-primary.danger { background: var(--terracota); }
    .offline {
      position: absolute; inset: 0; z-index: 80;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
      padding: 32px; background: var(--fondo); text-align: center;
    }
    .offline .art {
      display: flex; align-items: center; justify-content: center;
      width: 96px; height: 96px; border-radius: 50%; background: var(--crema); margin-bottom: 8px;
    }
    .offline h2 { font-family: var(--font-titulo); font-size: 1.375rem; }
    .offline p { font-size: 0.9375rem; line-height: 1.5; color: var(--texto-sec); max-width: 260px; }
    .offline .btn-secondary { margin-top: 12px; max-width: 240px; }
    @keyframes rise { from { transform: translateY(12px); opacity: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
  template: `
    @if (ui.toastMessage(); as msg) {
      <div class="toast" role="status" aria-live="polite">{{ msg }}</div>
    }

    @if (ui.loading(); as label) {
      <div class="loading" role="alert" aria-busy="true">
        <div class="spinner"></div>
        <span>{{ label }}</span>
      </div>
    }

    @let c = ui.confirmState();
    <mv-sheet [open]="!!c" [center]="true" [title]="c?.title ?? ''" (closed)="ui.resolveConfirm(false)">
      @if (c?.message) {
        <p class="confirm-msg">{{ c?.message }}</p>
      }
      <div sheet-actions>
        <button type="button" class="btn-primary" [class.danger]="c?.danger" (click)="ui.resolveConfirm(true)">
          {{ c?.confirmText ?? 'Confirmar' }}
        </button>
        <button type="button" class="btn-secondary" (click)="ui.resolveConfirm(false)">{{ c?.cancelText ?? 'Cancelar' }}</button>
      </div>
    </mv-sheet>

    @if (!ui.online()) {
      <div class="offline" role="alert">
        <div class="art"><mv-icon name="wifi-off" [size]="44" color="#A89070" /></div>
        <h2>Sin conexión</h2>
        <p>Parece que no tienes conexión. Tus recuerdos están a salvo, vuelve a intentarlo.</p>
        <button type="button" class="btn-secondary" (click)="retry()">Reintentar</button>
      </div>
    }
  `,
})
export class Overlays {
  protected readonly ui = inject(Ui);

  protected retry(): void {
    this.ui.online.set(navigator.onLine);
    if (!navigator.onLine) this.ui.toast('Aún sin conexión');
  }
}
