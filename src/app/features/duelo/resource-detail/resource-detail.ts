import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RESOURCES } from '../../../core/data/catalog';
import { FeedStore } from '../../../core/services/feed';
import { GriefStore } from '../../../core/services/grief';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';

type PlayState = 'idle' | 'playing' | 'paused';

/** Detalle del recurso: lectura y escucha con voz sintetizada. */
@Component({
  selector: 'mv-resource-detail',
  imports: [Header, Icon, EmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .hero { position: relative; height: 200px; background: var(--crema); }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(74, 59, 42, 0.45), transparent 60%); }
    .hero .icon {
      position: absolute; left: 16px; bottom: -22px; z-index: 1;
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 14px; background: var(--blanco);
      font-size: 1.5rem; box-shadow: var(--sombra-card);
    }
    .content { padding: 32px 16px 16px; display: flex; flex-direction: column; gap: 16px; }
    .meta { display: flex; align-items: center; gap: 8px; }
    .kind { background: var(--crema); color: var(--casa); }
    .kind.audio { background: rgba(115, 123, 76, 0.15); color: var(--verde); }
    .mins { font-size: 0.75rem; color: var(--texto-sec); }
    .read-badge { margin-left: auto; background: var(--verde); color: var(--blanco); }
    h2 { font-family: var(--font-titulo); font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
    .summary { font-family: var(--font-emotivo); font-size: 1.25rem; line-height: 1.3; color: var(--terracota); }

    /* Reproductor */
    .player { display: flex; flex-direction: column; gap: 12px; background: var(--madera); color: var(--crema); }
    .player-top { display: flex; align-items: center; gap: 12px; }
    .play {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 52px; height: 52px; border: none; border-radius: 50%;
      background: var(--terracota); cursor: pointer;
    }
    .play:hover { background: #8e4535; }
    .stop {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 48px; height: 48px; border: 1.5px solid rgba(235, 223, 198, 0.4); border-radius: 50%;
      background: transparent; cursor: pointer;
    }
    .stop:disabled { opacity: 0.35; cursor: not-allowed; }
    .player-info { flex: 1; min-width: 0; }
    .player-info strong { display: block; font-size: 0.9375rem; }
    .player-info span { font-size: 0.75rem; opacity: 0.8; }
    .progress { height: 6px; border-radius: 3px; background: rgba(235, 223, 198, 0.25); overflow: hidden; }
    .progress div { height: 100%; background: var(--dorado); transition: width 0.3s ease; }
    .note { font-size: 0.75rem; color: var(--texto-sec); line-height: 1.5; }

    .text { display: flex; flex-direction: column; gap: 4px; }
    .text p {
      padding: 8px 10px; margin: 0 -10px; border-radius: 10px;
      font-size: 1rem; line-height: 1.7; color: var(--madera);
      transition: background 0.2s ease;
    }
    .text p.current { background: rgba(212, 168, 67, 0.2); box-shadow: inset 3px 0 0 var(--dorado); }

    .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .btn-primary.done { background: var(--verde); }
  `,
  template: `
    <mv-header [title]="resource()?.kind === 'audio' ? 'Escuchar' : 'Lectura'" back="/duelo/recursos" />

    <div class="screen-body with-nav">
      @if (resource(); as r) {
        @let isRead = grief.isRead(r.id);
        <div class="hero">
          <img [src]="r.image" [alt]="'Imagen ilustrativa: ' + r.title" />
          <span class="icon" aria-hidden="true">{{ r.icon }}</span>
        </div>

        <article class="content">
          <div class="meta">
            <span class="chip kind" [class.audio]="r.kind === 'audio'">{{ r.kind === 'audio' ? 'Audio' : 'Artículo' }}</span>
            <span class="mins">{{ r.minutes }} min</span>
            @if (isRead) {
              <span class="chip read-badge"><mv-icon name="check" [size]="12" color="#FFFFFF" /> Leído</span>
            }
          </div>
          <h2>{{ r.title }}</h2>
          <p class="summary">{{ r.summary }}</p>

          @if (supported) {
            <section class="card player" aria-label="Reproductor de audio">
              <div class="player-top">
                <button type="button" class="play" (click)="toggle()" [attr.aria-label]="state() === 'playing' ? 'Pausar' : state() === 'paused' ? 'Reanudar' : 'Escuchar'">
                  <mv-icon [name]="state() === 'playing' ? 'pause' : 'play'" [size]="22" color="#FFFFFF" />
                </button>
                <div class="player-info">
                  <strong>{{ statusText() }}</strong>
                  <span aria-live="polite">
                    @if (current() >= 0) {
                      Párrafo {{ current() + 1 }} de {{ r.body.length }}
                    } @else {
                      {{ r.body.length }} párrafos · voz en español
                    }
                  </span>
                </div>
                <button type="button" class="stop" aria-label="Detener" [disabled]="state() === 'idle'" (click)="stop()">
                  <mv-icon name="stop" [size]="18" color="#EBDFC6" />
                </button>
              </div>
              <div class="progress" role="progressbar" aria-label="Progreso de la lectura"
                aria-valuemin="0" [attr.aria-valuemax]="r.body.length" [attr.aria-valuenow]="current() + 1">
                <div [style.width.%]="progress()"></div>
              </div>
            </section>
          } @else {
            <p class="note">🔇 Tu navegador no permite la lectura en voz alta. Puedes leer el texto con calma a continuación.</p>
          }

          <div class="text">
            @for (p of r.body; track $index) {
              <p [id]="'parrafo-' + $index" [class.current]="current() === $index">{{ p }}</p>
            }
          </div>

          <div class="actions">
            <button type="button" class="btn-primary" [class.done]="isRead" [attr.aria-pressed]="isRead" (click)="toggleRead(r.id)">
              <mv-icon name="check" [size]="20" color="#FFFFFF" />
              {{ isRead ? 'Leído' : 'Marcar como leído' }}
            </button>
            <button type="button" class="btn-secondary" (click)="share()">
              <mv-icon name="share" [size]="20" color="#A0503E" /> Compartir con familia
            </button>
          </div>
        </article>
      } @else {
        <mv-empty-state emoji="📭" title="No encontramos este recurso"
          message="Puede que el enlace haya cambiado. Te esperan otras lecturas en la biblioteca.">
          <a class="btn-primary" routerLink="/duelo/recursos">Volver a la biblioteca</a>
        </mv-empty-state>
      }
    </div>
  `,
})
export class ResourceDetail {
  protected readonly grief = inject(GriefStore);
  private readonly feed = inject(FeedStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly id = input.required<string>();

  protected readonly resource = computed(() => RESOURCES.find(r => r.id === this.id()) ?? null);

  // --- Lectura en voz alta (Web Speech API) ---
  private readonly synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
  protected readonly supported = !!this.synth;
  protected readonly state = signal<PlayState>('idle');
  /** Párrafo que se está leyendo (-1 = ninguno). */
  protected readonly current = signal(-1);
  /** Invalida los callbacks de lecturas anteriores (cancel() también dispara onend). */
  private session = 0;
  private voice: SpeechSynthesisVoice | null = null;

  protected readonly progress = computed(() => {
    const total = this.resource()?.body.length ?? 0;
    return total && this.current() >= 0 ? ((this.current() + 1) / total) * 100 : 0;
  });

  protected readonly statusText = computed(() => {
    switch (this.state()) {
      case 'playing': return 'Leyendo para ti…';
      case 'paused': return 'En pausa';
      default: return this.resource()?.kind === 'audio' ? 'Escuchar audio guiado' : 'Escuchar este artículo';
    }
  });

  constructor() {
    if (this.synth) {
      this.pickVoice();
      this.synth.addEventListener('voiceschanged', this.pickVoice);
    }

    inject(DestroyRef).onDestroy(() => {
      this.session++;
      this.synth?.cancel();
      this.synth?.removeEventListener('voiceschanged', this.pickVoice);
    });

    // Si cambia el recurso, se detiene la lectura anterior.
    effect(() => {
      this.resource();
      untracked(() => this.stop());
    });

    // Mantiene visible el párrafo que se está leyendo.
    effect(() => {
      const i = this.current();
      if (i < 0) return;
      this.host.nativeElement.querySelector(`#parrafo-${i}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /** Prefiere voz es-CL; si no hay, cualquier voz en español. */
  private readonly pickVoice = (): void => {
    const voices = this.synth?.getVoices() ?? [];
    this.voice =
      voices.find(v => v.lang.toLowerCase().replace('_', '-') === 'es-cl') ??
      voices.find(v => v.lang.toLowerCase().startsWith('es')) ??
      null;
  };

  protected toggle(): void {
    if (!this.synth) return;
    switch (this.state()) {
      case 'playing':
        this.synth.pause();
        this.state.set('paused');
        break;
      case 'paused':
        this.synth.resume();
        this.state.set('playing');
        break;
      default:
        this.speakFrom(0);
    }
  }

  protected stop(): void {
    this.session++;
    this.synth?.cancel();
    this.state.set('idle');
    this.current.set(-1);
  }

  private speakFrom(index: number): void {
    const synth = this.synth;
    const body = this.resource()?.body ?? [];
    if (!synth || !body.length) return;
    const session = ++this.session;
    synth.cancel();

    const speak = (i: number) => {
      if (session !== this.session) return;
      if (i >= body.length) {
        this.state.set('idle');
        this.current.set(-1);
        return;
      }
      const u = new SpeechSynthesisUtterance(body[i]);
      u.lang = this.voice?.lang ?? 'es-CL';
      if (this.voice) u.voice = this.voice;
      u.rate = 0.92;
      u.onend = () => speak(i + 1);
      u.onerror = e => {
        if (session !== this.session || e.error === 'interrupted' || e.error === 'canceled') return;
        this.stop();
        this.ui.toast('No se pudo reproducir la lectura');
      };
      this.current.set(i);
      synth.speak(u);
    };

    this.state.set('playing');
    speak(index);
  }

  protected toggleRead(id: string): void {
    this.grief.toggleRead(id);
    this.ui.toast(this.grief.isRead(id) ? 'Marcado como leído' : 'Marcado como no leído');
  }

  protected async share(): Promise<void> {
    const r = this.resource();
    if (!r) return;
    const post = await this.ui.withLoading('Compartiendo con tu familia…', () =>
      this.feed.create({ text: `Les comparto este recurso de Memoria Viva: «${r.title}». ${r.summary}`, taggedIds: [] }),
    );
    this.stop();
    this.router.navigate(['/familia/publicado', post.id]);
  }
}
