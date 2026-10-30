import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';

import { FamilyStore } from '../../../core/services/family';
import { Session } from '../../../core/services/session';
import { SettingsStore } from '../../../core/services/settings';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';
import { Sheet } from '../../../shared/sheet';
import { Toggle } from '../../../shared/toggle';

/** Configuración: menú de ajustes, invitación por QR y cierre de sesión. */
@Component({
  selector: 'mv-settings',
  imports: [RouterLink, Header, Icon, Toggle, Sheet, PersonAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
    .me { display: flex; align-items: center; gap: 12px; border-radius: 16px; }
    .me strong { display: block; font-family: var(--font-titulo); font-size: 1.0625rem; }
    .me span { font-size: 0.8125rem; color: var(--texto-sec); }
    .group { border-radius: 16px; overflow: hidden; padding: 0; }
    .group h2 { padding: 12px 16px 4px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--texto-sec); }
    .list-row { min-height: 56px; }
    .ico {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 10px; background: var(--crema); flex-shrink: 0;
    }
    .grow { flex: 1; min-width: 0; }
    .grow small { display: block; font-size: 0.75rem; color: var(--texto-sec); }
    .logout { color: var(--terracota); font-weight: 600; }
    .logout .ico { background: rgba(160, 80, 62, 0.1); }
    .version { text-align: center; font-size: 0.75rem; color: var(--texto-sec); }

    /* Modal 42 · Invitación QR */
    .invite { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .invite p { font-size: 0.875rem; line-height: 1.5; color: var(--texto-sec); }
    .qr {
      width: 240px; height: 240px; padding: 8px; border-radius: 16px;
      background: #fff; box-shadow: var(--sombra-card); border: 2px solid var(--dorado);
    }
    .qr img { width: 100%; height: 100%; image-rendering: pixelated; }
    .qr-loading { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.8125rem; color: var(--texto-sec); }
    .code { font-family: var(--font-titulo); font-size: 1.75rem; font-weight: 600; letter-spacing: 0.12em; color: var(--madera); }
    .code-label { font-size: 0.75rem !important; text-transform: uppercase; letter-spacing: 0.06em; }
    .not-admin { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0 16px; text-align: center; }
    .not-admin .art { font-size: 2.5rem; }
    .not-admin p { font-size: 0.875rem; line-height: 1.5; color: var(--texto-sec); }
  `,
  template: `
    <mv-header title="Configuración" back="/perfil" />

    <div class="screen-body with-nav">
      <div class="content">
        @let m = me();
        @if (m) {
          <a class="card me list-row" routerLink="datos">
            <mv-person-avatar [id]="m.id" [size]="52" />
            <div class="grow">
              <strong>{{ m.name }}</strong>
              <span>{{ email() }}</span>
            </div>
            <mv-icon name="chevron-right" [size]="20" color="#A89070" />
          </a>
        }

        <section class="card group">
          <h2>Mi cuenta</h2>
          <a class="list-row" routerLink="datos">
            <span class="ico"><mv-icon name="user" [size]="18" /></span>
            <span class="grow">Editar datos</span>
            <mv-icon name="chevron-right" [size]="20" color="#A89070" />
          </a>
          <a class="list-row" routerLink="privacidad">
            <span class="ico"><mv-icon name="shield" [size]="18" /></span>
            <span class="grow">Privacidad y seguridad</span>
            <mv-icon name="chevron-right" [size]="20" color="#A89070" />
          </a>
          <a class="list-row" routerLink="accesibilidad">
            <span class="ico"><mv-icon name="eye" [size]="18" /></span>
            <span class="grow">Accesibilidad</span>
            <mv-icon name="chevron-right" [size]="20" color="#A89070" />
          </a>
          <!-- El <label> nombra el interruptor (botón) que contiene -->
          <label class="list-row">
            <span class="ico"><mv-icon name="bell" [size]="18" /></span>
            <span class="grow">
              Notificaciones
              <small>{{ notifications() ? 'Activadas' : 'Desactivadas' }}</small>
            </span>
            <mv-toggle [on]="notifications()" (onChange)="setNotifications($event)" />
          </label>
        </section>

        <section class="card group">
          <h2>Familia {{ family().surname }}</h2>
          <button type="button" class="list-row" (click)="openInvite()">
            <span class="ico"><mv-icon name="user-plus" [size]="18" /></span>
            <span class="grow">
              Invitar familiar
              <small>Código del jardín {{ family().code }}</small>
            </span>
            <mv-icon name="qr" [size]="20" color="#A89070" />
          </button>
          <button type="button" class="list-row logout" (click)="logout()">
            <span class="ico"><mv-icon name="log-out" [size]="18" color="#A0503E" /></span>
            <span class="grow">Cerrar sesión</span>
          </button>
        </section>

        <p class="version">Memoria Viva · versión 1.0</p>
      </div>
    </div>

    <mv-sheet [open]="inviteOpen()" title="Invitar a la familia" (closed)="inviteOpen.set(false)">
      @if (isAdmin()) {
        <div class="invite">
          <p>Comparte este código para que tu familiar se una al jardín <strong>{{ family().garden }}</strong>.</p>
          <div class="qr">
            @if (qrDataUrl(); as src) {
              <img [src]="src" [alt]="'Código QR para unirse a la familia ' + family().surname" />
            } @else {
              <span class="qr-loading">Generando código…</span>
            }
          </div>
          <p class="code-label">Código del jardín</p>
          <p class="code">{{ family().code }}</p>
        </div>
      } @else {
        <div class="not-admin">
          <span class="art" aria-hidden="true">🌳</span>
          <p>Solo la persona administradora de la familia puede invitar a nuevos integrantes. Pídele que te comparta el código del jardín.</p>
        </div>
      }
      @if (isAdmin()) {
        <div sheet-actions>
          <button type="button" class="btn-primary" (click)="copyLink()">
            <mv-icon name="check" [size]="18" color="#FFFFFF" /> Copiar enlace
          </button>
          @if (canShare) {
            <button type="button" class="btn-secondary" (click)="share()">
              <mv-icon name="share" [size]="18" color="#A0503E" /> Compartir
            </button>
          }
        </div>
      }
    </mv-sheet>
  `,
})
export class SettingsMenu {
  private readonly session = inject(Session);
  private readonly familyStore = inject(FamilyStore);
  private readonly settingsStore = inject(SettingsStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  protected readonly me = this.session.me;
  protected readonly family = this.familyStore.family;
  protected readonly email = computed(() => this.session.user()?.email ?? '');
  protected readonly isAdmin = computed(() => !!this.session.me()?.isAdmin);
  protected readonly notifications = computed(() => this.settingsStore.settings().notifications);

  protected readonly inviteOpen = signal(false);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  private readonly inviteUrl = computed(() => `${location.origin}/?codigo=${encodeURIComponent(this.family().code)}`);

  protected setNotifications(on: boolean): void {
    this.settingsStore.set('notifications', on);
    this.ui.toast(on ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
  }

  protected async openInvite(): Promise<void> {
    this.inviteOpen.set(true);
    if (!this.isAdmin()) return;
    try {
      const url = await QRCode.toDataURL(this.inviteUrl(), {
        margin: 1,
        width: 240,
        color: { dark: '#4A3B2A', light: '#FFFFFF' },
      });
      this.qrDataUrl.set(url);
    } catch {
      this.ui.toast('No pudimos generar el código QR');
    }
  }

  protected async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.inviteUrl());
      this.ui.toast('Enlace copiado');
    } catch {
      this.ui.toast(`Copia este código: ${this.family().code}`);
    }
  }

  protected async share(): Promise<void> {
    try {
      await navigator.share({
        title: 'Memoria Viva',
        text: `Únete a la familia ${this.family().surname} en Memoria Viva con el código ${this.family().code}.`,
        url: this.inviteUrl(),
      });
    } catch {
      // El usuario canceló el diálogo de compartir: no hacemos nada.
    }
  }

  /** Modal 43 · Confirmación de salida. */
  protected async logout(): Promise<void> {
    const ok = await this.ui.confirm({
      title: '¿Estás seguro que quieres cerrar sesión?',
      message: 'Tus recuerdos quedarán guardados en este dispositivo.',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    this.session.logout();
    void this.router.navigateByUrl('/ingresar');
  }
}
