import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** 50. Error 404: página no encontrada. */
@Component({
  selector: 'mv-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <img src="assets/logo/logo-memoria-viva.png" alt="" />
    <p class="code">404</p>
    <h1>Página no encontrada</h1>
    <p class="msg">Este sendero del jardín no existe. Volvamos a un lugar conocido.</p>
    <a class="btn-primary" routerLink="/">Ir al inicio</a>
  `,
  styles: `
    :host { align-items: center; justify-content: center; gap: 8px; padding: 32px; text-align: center; }
    img { width: 96px; height: 96px; object-fit: contain; opacity: 0.85; }
    .code { font-family: var(--font-emotivo); font-size: 2.5rem; color: var(--terracota); line-height: 1; }
    h1 { font-family: var(--font-titulo); font-size: 1.5rem; }
    .msg { max-width: 260px; font-size: 0.9375rem; line-height: 1.5; color: var(--texto-sec); margin-bottom: 16px; }
    .btn-primary { max-width: 240px; text-decoration: none; }
  `,
})
export class NotFound {}
