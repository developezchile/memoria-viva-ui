import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { EMOTIONS, EMOTION_BY_ID, EmotionInfo } from '../../../core/data/catalog';
import { GriefStore } from '../../../core/services/grief';
import { Session } from '../../../core/services/session';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { Sheet } from '../../../shared/sheet';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';

const INTENSITY = ['Leve', 'Suave', 'Moderada', 'Intensa', 'Muy intensa'];

/** Mi Duelo: grid de emociones y tarjeta informativa de cada una (modal 41). */
@Component({
  selector: 'mv-grief-home',
  imports: [Header, Sheet, Icon, RouterLink, DatePipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 20px 16px; display: flex; flex-direction: column; gap: 24px; }
    .hello { font-family: var(--font-emotivo); font-size: 1.625rem; color: var(--terracota); line-height: 1.1; }
    .title { margin-top: 4px; font-family: var(--font-titulo); font-size: 1.5rem; font-weight: 600; color: var(--madera); }
    .lead { margin-top: 6px; font-size: 0.875rem; line-height: 1.5; color: var(--texto-sec); }

    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px 4px; list-style: none; margin: 0; padding: 0; }
    .emotion {
      display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%;
      padding: 4px 0; border-radius: 12px;
    }
    .emotion:active .circle { transform: scale(0.94); }
    .circle {
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%;
      font-size: 1.625rem; transition: transform 0.12s ease;
      border: 2px solid transparent;
    }
    .emotion:hover .circle { border-color: currentColor; }
    .label { font-size: 0.6875rem; font-weight: 500; color: var(--madera); text-align: center; }

    .last { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
    .last .circle { width: 48px; height: 48px; font-size: 1.375rem; flex-shrink: 0; }
    .last-info { flex: 1; min-width: 0; }
    .kicker { font-size: 0.75rem; color: var(--texto-sec); }
    .last-name { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; }
    .last-note { margin-top: 2px; font-size: 0.8125rem; color: var(--texto-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dots { display: flex; gap: 3px; margin-top: 4px; }
    .dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--borde); }
    .dots span.on { background: var(--terracota); }

    .shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .shortcut {
      display: flex; flex-direction: column; gap: 8px; min-height: 120px;
      text-decoration: none; color: var(--madera);
    }
    .shortcut .ico {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 12px; background: var(--crema);
    }
    .shortcut strong { font-family: var(--font-titulo); font-size: 1rem; font-weight: 600; line-height: 1.2; }
    .shortcut small { font-size: 0.75rem; color: var(--texto-sec); line-height: 1.4; }

    /* Tarjeta de emoción */
    .hero { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0 16px; }
    .hero .circle { width: 80px; height: 80px; font-size: 2.5rem; }
    .hero p { font-family: var(--font-emotivo); font-size: 1.25rem; color: var(--terracota); text-align: center; }
    .info { display: flex; flex-direction: column; gap: 12px; }
    .info h3 { font-family: var(--font-titulo); font-size: 0.9375rem; font-weight: 600; margin-bottom: 4px; }
    .info p { font-size: 0.875rem; line-height: 1.55; color: var(--madera); }
    .info ul { margin: 0; padding-left: 20px; font-size: 0.875rem; line-height: 1.6; }
  `,
  template: `
    <mv-header title="Mi Duelo" />

    <div class="screen-body with-nav">
      <div class="content">
        <section>
          <p class="hello">Hola, {{ firstName() }}</p>
          <h2 class="title">¿Cómo te sientes hoy?</h2>
          <p class="lead">Toca la emoción que más se parece a lo que llevas dentro. Todas son bienvenidas aquí.</p>
        </section>

        <ul class="grid" aria-label="Emociones">
          @for (e of emotions; track e.id) {
            <li>
              <button type="button" class="btn-reset emotion" [style.color]="e.color" (click)="selected.set(e)"
                [attr.aria-label]="'Ver información sobre ' + e.label">
                <span class="circle" [style.background]="soft(e.color)" aria-hidden="true">{{ e.emoji }}</span>
                <span class="label">{{ e.label }}</span>
              </button>
            </li>
          }
        </ul>

        @if (last(); as l) {
          @let info = lastInfo()!;
          <section>
            <h2 class="section-title">Tu último registro</h2>
            <a class="card last" routerLink="/duelo/historial">
              <span class="circle" [style.background]="soft(info.color)" aria-hidden="true">{{ info.emoji }}</span>
              <div class="last-info">
                <p class="kicker">{{ l.date | date: 'EEEE d MMMM' }} · {{ l.createdAt | timeAgo }}</p>
                <p class="last-name">{{ info.label }}</p>
                <div class="dots" role="img" [attr.aria-label]="'Intensidad ' + l.intensity + ' de 5: ' + intensityLabel(l.intensity)">
                  @for (n of [1, 2, 3, 4, 5]; track n) {
                    <span [class.on]="n <= l.intensity"></span>
                  }
                </div>
                @if (l.note) {
                  <p class="last-note">“{{ l.note }}”</p>
                }
              </div>
              <mv-icon name="chevron-right" [size]="20" color="#A89070" />
            </a>
          </section>
        }

        <section class="shortcuts" aria-label="Accesos">
          <a class="card shortcut" routerLink="/duelo/historial">
            <span class="ico"><mv-icon name="heart" [size]="22" color="#A0503E" /></span>
            <strong>Mi historial emocional</strong>
            <small>Mira cómo ha ido cambiando tu sentir.</small>
          </a>
          <a class="card shortcut" routerLink="/duelo/recursos">
            <span class="ico"><mv-icon name="book" [size]="22" color="#737B4C" /></span>
            <strong>Biblioteca de recursos</strong>
            <small>Lecturas y audios para acompañarte.</small>
          </a>
        </section>
      </div>
    </div>

    <mv-sheet [open]="!!selected()" [title]="selected()?.label ?? ''" (closed)="selected.set(null)">
      @if (selected(); as e) {
        <div class="hero">
          <span class="circle" [style.background]="soft(e.color)" aria-hidden="true">{{ e.emoji }}</span>
          <p>Lo que sientes tiene un nombre</p>
        </div>
        <div class="info">
          <div class="card"><h3>Qué es</h3><p>{{ e.what }}</p></div>
          <div class="card"><h3>Por qué aparece</h3><p>{{ e.why }}</p></div>
          <div class="card"><h3>Qué esperar</h3><p>{{ e.expect }}</p></div>
          <div class="card">
            <h3>Cómo sentirte mejor</h3>
            <ul>
              @for (h of e.help; track h) {
                <li>{{ h }}</li>
              }
            </ul>
          </div>
        </div>
      }
      <div sheet-actions>
        <button type="button" class="btn-primary" (click)="register()">Registrar</button>
      </div>
    </mv-sheet>
  `,
})
export class GriefHome {
  private readonly session = inject(Session);
  private readonly grief = inject(GriefStore);
  private readonly router = inject(Router);

  protected readonly emotions = EMOTIONS;
  protected readonly selected = signal<EmotionInfo | null>(null);

  protected readonly firstName = computed(() => this.session.me()?.name.split(' ')[0] ?? '');
  protected readonly last = computed(() => this.grief.logs()[0] ?? null);
  protected readonly lastInfo = computed(() => {
    const l = this.last();
    return l ? EMOTION_BY_ID[l.emotion] : null;
  });

  /** Fondo suave del color de la emoción (hex + transparencia). */
  protected soft(color: string): string {
    return color + '33';
  }

  protected intensityLabel(n: number): string {
    return INTENSITY[n - 1] ?? '';
  }

  protected register(): void {
    const e = this.selected();
    if (!e) return;
    this.selected.set(null);
    this.router.navigate(['/duelo/registrar', e.id]);
  }
}
