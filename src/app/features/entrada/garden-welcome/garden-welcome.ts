import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FamilyStore } from '../../../core/services/family';
import { Session } from '../../../core/services/session';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';

/** 4. Bienvenida al jardín: "Bienvenido a la familia [Apellido]". */
@Component({
  selector: 'mv-garden-welcome',
  imports: [RouterLink, Icon, PersonAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <figure class="cover">
      <img src="assets/img/quillay.jpg" alt="Quillay en el jardín memorial" />
    </figure>

    <div class="screen-body content">
      <div class="badge"><mv-icon name="check" [size]="32" color="#FFFFFF" /></div>
      <p class="emotive kicker">Código válido</p>
      <h1>Bienvenido a la familia {{ family.family().surname }}</h1>
      <p class="garden"><mv-icon name="map-pin" [size]="16" color="#7C563D" /> {{ family.family().garden }}</p>

      <div class="card loved">
        <p class="loved-title">Aquí florece la memoria de</p>
        <div class="loved-list">
          @for (m of family.memorials(); track m.id) {
            <div class="loved-item">
              <mv-person-avatar [id]="m.id" [size]="56" />
              <span>{{ m.name }}</span>
            </div>
          }
        </div>
      </div>
    </div>

    <div class="footer">
      <a class="btn-primary" routerLink="/registro">Entrar</a>
      <a class="btn-link have-account" routerLink="/ingresar">Ya tengo una cuenta</a>
    </div>
  `,
  styles: `
    .cover { position: relative; flex-shrink: 0; height: 220px; margin: 0; overflow: hidden; }
    .cover img { width: 100%; height: 100%; object-fit: cover; }
    .cover::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, var(--fondo)); }
    .content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 24px 16px; margin-top: -40px; position: relative; }
    .badge {
      display: flex; align-items: center; justify-content: center;
      width: 64px; height: 64px; border-radius: 50%; background: var(--verde);
      box-shadow: 0 8px 24px rgba(115, 123, 76, 0.35); border: 4px solid var(--fondo);
    }
    .kicker { margin-top: 12px; font-size: 1.25rem; }
    h1 { font-family: var(--font-titulo); font-size: 1.625rem; line-height: 1.2; }
    .garden { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 0.9375rem; color: var(--casa); font-weight: 600; }
    .loved { width: 100%; margin-top: 24px; }
    .loved-title { font-size: 0.8125rem; color: var(--texto-sec); margin-bottom: 12px; }
    .loved-list { display: flex; justify-content: center; gap: 24px; }
    .loved-item { display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: var(--font-titulo); font-size: 0.9375rem; }
    .footer { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 24px 32px; flex-shrink: 0; }
    .footer .btn-primary { text-decoration: none; }
    .have-account { color: var(--texto-sec); text-decoration: none; }
  `,
})
export class GardenWelcome implements OnInit {
  protected readonly family = inject(FamilyStore);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.session.gardenCode()) this.router.navigateByUrl('/escanear');
  }
}
