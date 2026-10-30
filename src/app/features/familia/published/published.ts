import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** ¡Publicado! · Confirmación con el logo (sin texto). */
@Component({
  selector: 'mv-published',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding-left: 24px; padding-right: 24px; text-align: center;
    }
    .logo {
      width: 140px; height: 140px; object-fit: contain;
      animation: grow 0.7s cubic-bezier(0.2, 0.8, 0.3, 1.2) both;
    }
    h1 { font-family: var(--font-titulo); font-size: 1.75rem; font-weight: 600; color: var(--madera); }
    .emotive { font-size: 1.375rem; line-height: 1.3; color: var(--casa); max-width: 260px; }
    .actions { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px; margin-top: 16px; }
    .actions a { text-decoration: none; }
    @keyframes grow { from { transform: scale(0.6) rotate(-12deg); opacity: 0; } }
  `,
  template: `
    <div class="screen-body with-nav">
      <img class="logo" src="assets/logo/logo-memoria-viva.png" alt="Memoria Viva" />
      <h1>¡Publicado!</h1>
      <p class="emotive">Tu recuerdo ya está en el muro familiar</p>
      <div class="actions">
        <a class="btn-primary" [routerLink]="['/familia/post', id()]">Ver publicación</a>
        <a class="btn-secondary" routerLink="/familia">Volver al feed</a>
      </div>
    </div>
  `,
})
export class Published {
  readonly id = input.required<string>();
}
