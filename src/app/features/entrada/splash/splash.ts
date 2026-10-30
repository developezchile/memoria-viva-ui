import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { Session } from '../../../core/services/session';

/** 1. Splash: logo semilla animado. Decide a dónde ir según la sesión. */
@Component({
  selector: 'mv-splash',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen', '(click)': 'next()' },
  template: `
    <div class="glow"></div>
    <div class="brand">
      <div class="seed">
        <img src="assets/logo/logo-memoria-viva.png" alt="" />
      </div>
      <h1>Memoria Viva</h1>
      <p class="emotive">La memoria que crece</p>
    </div>
    <p class="hint">Toca para continuar</p>
  `,
  styles: `
    :host { align-items: center; justify-content: center; background: var(--crema); cursor: pointer; }
    .glow {
      position: absolute; width: 320px; height: 320px; border-radius: 50%;
      background: radial-gradient(circle, rgba(115, 123, 76, 0.22), transparent 70%);
      animation: breathe 3s ease-in-out infinite;
    }
    .brand { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .seed { width: 148px; height: 148px; animation: grow 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    .seed img { width: 100%; height: 100%; object-fit: contain; }
    h1 {
      margin-top: 16px; font-family: var(--font-titulo); font-size: 2.25rem; font-weight: 700; color: var(--madera);
      animation: fade-up 0.8s 0.7s ease-out both;
    }
    .emotive { margin-top: 4px; font-size: 1.5rem; animation: fade-up 0.8s 1s ease-out both; }
    .hint { position: absolute; bottom: 48px; font-size: 0.8125rem; color: var(--texto-sec); animation: fade-up 0.6s 1.8s ease-out both; }
    @keyframes grow { from { transform: scale(0.2) translateY(40px); opacity: 0; } 60% { opacity: 1; } }
    @keyframes fade-up { from { transform: translateY(10px); opacity: 0; } }
    @keyframes breathe { 50% { transform: scale(1.12); opacity: 0.7; } }
  `,
})
export class Splash implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(Session);
  private readonly destroyRef = inject(DestroyRef);

  /** Código de jardín recibido desde el QR físico: https://…/?codigo=MV-0001 */
  readonly codigo = input<string>();

  private done = false;

  ngOnInit(): void {
    const timer = setTimeout(() => this.next(), 2600);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }

  protected next(): void {
    if (this.done) return;
    this.done = true;
    const code = this.codigo();
    if (this.session.isLoggedIn()) {
      this.router.navigateByUrl('/familia');
    } else if (code && this.session.validateGardenCode(code)) {
      this.router.navigateByUrl('/bienvenida');
    } else {
      this.router.navigateByUrl(this.session.onboarded() ? '/ingresar' : '/onboarding/1');
    }
  }
}
