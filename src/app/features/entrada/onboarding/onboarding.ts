import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../../../shared/icon';

const MODULES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'people', title: 'Mi Familia', text: 'Un muro privado para compartir recuerdos' },
  { icon: 'heart', title: 'Mi Duelo', text: 'Tu diario emocional y recursos de apoyo' },
  { icon: 'calendar', title: 'Calendario', text: 'Fechas especiales, rituales y tareas' },
  { icon: 'hands', title: 'Bienestar', text: 'Test y especialistas en duelo' },
  { icon: 'user', title: 'Mi Perfil', text: 'Tu diario de vida y tu herencia' },
];

/** 2–3. Onboarding: bienvenida y explicación de módulos y privacidad. */
@Component({
  selector: 'mv-onboarding',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <div class="top">
      <span class="dots" aria-label="Paso {{ step() }} de 2">
        <span [class.on]="step() === 1"></span><span [class.on]="step() === 2"></span>
      </span>
      <a class="skip" routerLink="/ingresar">Ya tengo cuenta</a>
    </div>

    @if (step() === 1) {
      <div class="screen-body content">
        <figure class="hero">
          <img src="assets/img/plantando.png" alt="Manos de una niña y un adulto plantando un árbol" />
        </figure>
        <p class="emotive kicker">Bienvenida, bienvenido</p>
        <h1>Un lugar íntimo para quienes amamos</h1>
        <p class="lead">
          Memoria Viva es un refugio digital para tu familia: un espacio tranquilo, sin algoritmos ni ruido,
          donde el recuerdo de tu ser querido —persona o mascota— sigue creciendo como un árbol.
        </p>
      </div>
      <div class="footer">
        <a class="btn-primary" routerLink="/onboarding/2">Siguiente</a>
      </div>
    } @else {
      <div class="screen-body content">
        <p class="emotive kicker">Así te acompañamos</p>
        <h1>Todo lo que encontrarás</h1>
        <ul class="modules">
          @for (m of modules; track m.title) {
            <li>
              <span class="mod-icon"><mv-icon [name]="m.icon" color="#737B4C" [size]="22" /></span>
              <span><strong>{{ m.title }}</strong><small>{{ m.text }}</small></span>
            </li>
          }
        </ul>
        <div class="privacy card">
          <mv-icon name="shield" color="#A0503E" [size]="22" />
          <p>Solo tu familia puede ver lo que compartes. Tú decides qué publicar y qué guardar en privado.</p>
        </div>
      </div>
      <div class="footer">
        <a class="btn-primary" routerLink="/escanear">Comenzar</a>
        <a class="btn-link back" routerLink="/onboarding/1">Volver</a>
      </div>
    }
  `,
  styles: `
    .top { display: flex; align-items: center; justify-content: space-between; padding: 48px 24px 8px; flex-shrink: 0; }
    .dots { display: flex; gap: 6px; }
    .dots span { width: 8px; height: 8px; border-radius: 4px; background: var(--borde); transition: width 0.2s ease; }
    .dots span.on { width: 24px; background: var(--verde); }
    .skip { font-size: 0.875rem; color: var(--texto-sec); text-decoration: none; }
    .content { padding: 16px 24px 8px; }
    .hero { margin: 0 0 24px; height: 260px; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 24px rgba(107, 79, 58, 0.18); }
    .hero img { width: 100%; height: 100%; object-fit: cover; object-position: center 25%; }
    .kicker { font-size: 1.375rem; }
    h1 { margin: 4px 0 12px; font-family: var(--font-titulo); font-size: 1.625rem; line-height: 1.2; }
    .lead { font-size: 0.9375rem; line-height: 1.6; color: var(--texto-sec); }
    .modules { list-style: none; margin: 8px 0 20px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .modules li { display: flex; align-items: center; gap: 14px; }
    .mod-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 44px; height: 44px; border-radius: 14px; background: rgba(115, 123, 76, 0.12);
    }
    .modules strong { display: block; font-size: 0.9375rem; }
    .modules small { display: block; font-size: 0.8125rem; color: var(--texto-sec); }
    .privacy { display: flex; gap: 12px; align-items: flex-start; }
    .privacy p { font-size: 0.875rem; line-height: 1.5; color: var(--madera); }
    .footer { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 24px 32px; flex-shrink: 0; }
    .footer .btn-primary { text-decoration: none; }
    .back { color: var(--texto-sec); text-decoration: none; }
  `,
})
export class Onboarding {
  readonly paso = input<string>('1');
  protected readonly step = computed(() => (this.paso() === '2' ? 2 : 1));
  protected readonly modules = MODULES;
}
