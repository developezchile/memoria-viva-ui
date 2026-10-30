import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { Icon } from '../../../shared/icon';

/** Iniciar sesión con correo y contraseña. */
@Component({
  selector: 'mv-login',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <div class="hero">
      <div class="blob"></div>
      <img class="logo" src="assets/logo/logo-memoria-viva.png" alt="" />
      <h1>Bienvenido</h1>
      <p class="emotive">La memoria que crece</p>
    </div>

    <form class="screen-body form" novalidate (submit)="$event.preventDefault(); submit()">
      <div>
        <label class="field-label" for="email">Correo electrónico</label>
        <input id="email" class="input" type="email" autocomplete="username" inputmode="email" placeholder="tu@correo.cl"
          [value]="email()" (input)="email.set($any($event.target).value); error.set('')" />
      </div>

      <div>
        <label class="field-label" for="password">Contraseña</label>
        <div class="pass">
          <input id="password" class="input" [type]="showPass() ? 'text' : 'password'" autocomplete="current-password"
            placeholder="Tu contraseña" [value]="password()" (input)="password.set($any($event.target).value); error.set('')" />
          <button type="button" class="icon-btn" [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            (click)="showPass.set(!showPass())">
            <mv-icon name="eye" [size]="20" [color]="showPass() ? '#737B4C' : '#A89070'" />
          </button>
        </div>
      </div>

      @if (error()) {
        <p class="error-text" role="alert">{{ error() }}</p>
      }

      <button type="submit" class="btn-primary" [disabled]="!email() || !password()">Iniciar sesión</button>

      <div class="divider"><span></span>o<span></span></div>

      <a class="btn-secondary" routerLink="/escanear">
        <mv-icon name="qr" [size]="18" color="#A0503E" /> Escanear QR del jardín
      </a>
      <p class="first-time">¿Primera vez? Escanea el código de la placa del jardín para unirte a tu familia.</p>
    </form>
  `,
  styles: `
    .hero {
      position: relative; overflow: hidden; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 240px; padding-top: 24px; background: var(--crema);
      border-bottom-left-radius: 40px; border-bottom-right-radius: 40px;
    }
    .blob { position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(115, 123, 76, 0.12); }
    .logo { width: 84px; height: 84px; object-fit: contain; margin-bottom: 8px; }
    h1 { font-family: var(--font-titulo); font-size: 1.75rem; font-weight: 700; }
    .emotive { font-size: 1.125rem; }
    .form { display: flex; flex-direction: column; gap: 16px; padding: 28px 24px 32px; }
    .pass { position: relative; }
    .pass .input { padding-right: 52px; }
    .pass .icon-btn { position: absolute; right: 4px; top: 4px; }
    .divider { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: var(--texto-sec); }
    .divider span { flex: 1; height: 1px; background: var(--borde); }
    .btn-secondary { text-decoration: none; }
    .first-time { font-size: 0.8125rem; line-height: 1.5; color: var(--texto-sec); text-align: center; }
  `,
})
export class Login {
  private readonly session = inject(Session);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPass = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    try {
      await this.ui.withLoading('Entrando…', () => this.session.login(this.email(), this.password()));
      this.router.navigateByUrl('/familia');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No pudimos iniciar sesión.');
    }
  }
}
