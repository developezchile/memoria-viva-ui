import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Estado vacío con ilustración, título y mensaje. Contenido proyectado = acción.
 * Uso: `<mv-empty-state emoji="🌱" title="Aún no hay publicaciones" message="…"><button>…</button></mv-empty-state>`
 */
@Component({
  selector: 'mv-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 24px; gap: 8px; }
    .art {
      display: flex; align-items: center; justify-content: center;
      width: 88px; height: 88px; margin-bottom: 8px; border-radius: 50%;
      background: var(--crema); font-size: 40px;
    }
    h3 { font-family: var(--font-titulo); font-size: 1.125rem; font-weight: 600; }
    p { max-width: 260px; font-size: 0.875rem; line-height: 1.5; color: var(--texto-sec); }
    .action:not(:empty) { margin-top: 12px; width: 100%; max-width: 260px; }
  `,
  template: `
    <div class="art" aria-hidden="true">{{ emoji() }}</div>
    <h3>{{ title() }}</h3>
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <div class="action"><ng-content /></div>
  `,
})
export class EmptyState {
  readonly emoji = input('🌱');
  readonly title = input.required<string>();
  readonly message = input('');
}
