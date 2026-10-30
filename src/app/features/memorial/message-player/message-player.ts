import { AsyncPipe, DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyStore } from '../../../core/services/family';
import { MemorialStore } from '../../../core/services/memorials';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { MediaUrlPipe } from '../../../shared/media-url.pipe';
import { PersonAvatar } from '../../../shared/person-avatar';
import { daysUntil, toDate } from '../dates';

/**
 * Reproductor de mensaje póstumo. Primero una introducción suave; el mensaje
 * se revela solo cuando la persona decide abrirlo.
 */
@Component({
  selector: 'mv-message-player',
  imports: [AsyncPipe, DatePipe, RouterLink, Header, Icon, MediaUrlPipe, PersonAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { display: flex; flex-direction: column; padding-left: 16px; padding-right: 16px; }
    .center {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 24px 8px; text-align: center;
    }
    .glow {
      display: inline-flex; padding: 6px; border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(212, 168, 67, 0.12), 0 0 32px rgba(212, 168, 67, 0.35);
      animation: breathe 4s ease-in-out infinite;
    }
    .lock-art {
      display: flex; align-items: center; justify-content: center;
      width: 88px; height: 88px; border-radius: 50%; background: var(--crema);
    }
    h2 { font-family: var(--font-titulo); font-size: 1.375rem; font-weight: 600; color: var(--madera); }
    .emotive { font-size: 1.375rem; line-height: 1.3; color: var(--casa); max-width: 280px; }
    .from { font-size: 0.9375rem; color: var(--madera); }
    .date { font-size: 0.8125rem; color: var(--texto-sec); }
    .actions { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px; margin-top: 12px; }
    a.btn-primary, a.btn-secondary { text-decoration: none; }
    .reveal { padding: 16px 0; animation: fadein 0.8s ease-out both; }
    .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .head .title { font-family: var(--font-titulo); font-size: 1.25rem; font-weight: 600; }
    .letter {
      position: relative; padding: 24px 20px; border-radius: 16px;
      background: #fffdf8; box-shadow: var(--sombra-card);
      background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(212, 197, 169, 0.45) 32px);
      background-position: 0 20px;
    }
    .letter p {
      font-family: var(--font-emotivo); font-size: 1.5rem; line-height: 32px; color: var(--madera);
      white-space: pre-line; overflow-wrap: anywhere;
    }
    .media-box { padding: 16px; border-radius: 16px; background: var(--blanco); box-shadow: var(--sombra-card); }
    .media-box audio, .media-box video { display: block; width: 100%; border-radius: 12px; }
    .listen { margin-top: 12px; }
    .missing { font-size: 0.875rem; color: var(--texto-sec); text-align: center; padding: 16px; }
    .after { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    @keyframes breathe { 50% { transform: scale(1.04); } }
    @keyframes fadein { from { opacity: 0; transform: translateY(12px); } }
  `,
  template: `
    @let msg = message();
    <mv-header [title]="msg && state() === 'ready' && opened() ? msg.title : 'Mensaje'" [back]="vaultUrl()" />

    <div class="screen-body with-nav">
      @if (!msg) {
        <div class="center">
          <div class="lock-art"><mv-icon name="mail" [size]="40" color="#A89070" /></div>
          <h2>No encontramos este mensaje</h2>
          <p class="date">Puede que el enlace no sea correcto.</p>
          <div class="actions"><a class="btn-primary" [routerLink]="vaultUrl()">Volver a la bóveda</a></div>
        </div>
      } @else if (state() !== 'ready') {
        <!-- Bloqueado: aún no llega su fecha o no es para mí -->
        <div class="center">
          <div class="lock-art"><mv-icon name="lock" [size]="40" color="#A89070" /></div>
          <h2>{{ msg.title }}</h2>
          @if (state() === 'locked') {
            <p class="emotive">Este mensaje está esperando su momento</p>
            <p class="date">
              Se abrirá el {{ toDate(msg.deliverAt) | date: 'longDate' }}
              ({{ daysLeft() === 1 ? 'falta 1 día' : 'faltan ' + daysLeft() + ' días' }})
            </p>
          } @else {
            <p class="emotive">Este mensaje fue guardado para otra persona de la familia</p>
          }
          <div class="actions"><a class="btn-secondary" [routerLink]="vaultUrl()">Volver a la bóveda</a></div>
        </div>
      } @else if (!opened()) {
        <!-- Introducción suave antes de revelar -->
        <div class="center">
          <span class="glow"><mv-person-avatar [id]="msg.fromId" [size]="96" /></span>
          <p class="emotive">Este mensaje fue guardado con amor para ti. Tómate tu tiempo.</p>
          <p class="from">De <strong>{{ family.nameOf(msg.fromId) }}</strong></p>
          <p class="date">Guardado el {{ toDate(msg.createdAt) | date: 'longDate' }} · para el {{ toDate(msg.deliverAt) | date: 'longDate' }}</p>
          <div class="actions">
            <button type="button" class="btn-primary" (click)="opened.set(true)">
              <mv-icon name="mail" [size]="20" color="#FFFFFF" /> Abrir mensaje
            </button>
            <a class="btn-secondary" [routerLink]="vaultUrl()">Quizás más tarde</a>
          </div>
        </div>
      } @else {
        <div class="reveal">
          <div class="head">
            <mv-person-avatar [id]="msg.fromId" [size]="48" />
            <div>
              <p class="title">{{ msg.title }}</p>
              <p class="date">De {{ family.nameOf(msg.fromId) }} · {{ toDate(msg.deliverAt) | date: 'longDate' }}</p>
            </div>
          </div>

          @if (msg.format !== 'texto') {
            <div class="media-box">
              @if (msg.mediaId) {
                @if (msg.format === 'video') {
                  <video [src]="(msg.mediaId | mediaUrl | async) ?? ''" controls playsinline preload="metadata"></video>
                } @else {
                  <audio [src]="(msg.mediaId | mediaUrl | async) ?? ''" controls preload="metadata"></audio>
                }
              } @else {
                <p class="missing">La grabación no está disponible en este dispositivo.</p>
              }
            </div>
          }

          @if (msg.text) {
            <div class="letter" [style.margin-top.px]="msg.format !== 'texto' ? 16 : 0">
              <p>{{ msg.text }}</p>
            </div>
            @if (canSpeak) {
              <button type="button" class="btn-secondary listen" (click)="toggleSpeech(msg.text)">
                <mv-icon [name]="speaking() ? 'stop' : 'volume'" [size]="20" color="#A0503E" />
                {{ speaking() ? 'Detener lectura' : 'Escuchar' }}
              </button>
            }
          }

          <div class="after">
            <a class="btn-primary" [routerLink]="['/memorial', id()]" [queryParams]="{ homenaje: 'mensaje' }">Responder con un homenaje</a>
            <a class="btn-secondary" [routerLink]="vaultUrl()">Volver a la bóveda</a>
          </div>
        </div>
      }
    </div>
  `,
})
export class MessagePlayer {
  private readonly store = inject(MemorialStore);
  protected readonly family = inject(FamilyStore);
  private readonly speech = inject(DOCUMENT).defaultView?.speechSynthesis;

  readonly id = input.required<string>();
  readonly mensaje = input.required<string>();

  protected readonly toDate = toDate;
  protected readonly canSpeak = !!this.speech;
  protected readonly opened = signal(false);
  protected readonly speaking = signal(false);

  protected readonly vaultUrl = computed(() => `/memorial/${this.id()}/boveda`);
  protected readonly message = computed(() => {
    const m = this.store.message(this.mensaje());
    return m && m.fromId === this.id() ? m : undefined;
  });
  protected readonly state = computed<'ready' | 'locked' | 'forbidden'>(() => {
    const m = this.message();
    if (!m || !this.store.canOpen(m)) return 'forbidden';
    return this.store.isUnlocked(m) ? 'ready' : 'locked';
  });
  protected readonly daysLeft = computed(() => {
    const m = this.message();
    return m ? daysUntil(m.deliverAt) : 0;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.speech?.cancel());
  }

  protected toggleSpeech(text: string): void {
    if (!this.speech) return;
    if (this.speaking()) {
      this.speech.cancel();
      this.speaking.set(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL';
    u.rate = 0.9;
    u.onend = u.onerror = () => this.speaking.set(false);
    this.speech.cancel();
    this.speech.speak(u);
    this.speaking.set(true);
  }
}
