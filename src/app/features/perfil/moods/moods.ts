import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EMOTION_BY_ID } from '../../../core/data/catalog';
import { EmotionLog } from '../../../core/data/models';
import { GriefStore } from '../../../core/services/grief';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';

interface MonthGroup {
  key: string;
  /** Primer día del mes, para formatear el encabezado. */
  date: Date;
  logs: EmotionLog[];
}

/** Mis Estados de Ánimo: historial completo agrupado por mes. */
@Component({
  selector: 'mv-moods',
  imports: [DatePipe, RouterLink, Header, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; }
    .summary { margin-bottom: 20px; font-size: 0.875rem; color: var(--texto-sec); }
    .summary .emotive { font-size: 1.25rem; }
    .month { margin-bottom: 24px; }
    .month h2 { text-transform: capitalize; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .log { display: flex; gap: 12px; border-radius: 16px; }
    .emo {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 50%; font-size: 1.375rem; flex-shrink: 0;
    }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .label { font-weight: 600; font-size: 0.9375rem; }
    .when { font-size: 0.75rem; color: var(--texto-sec); white-space: nowrap; }
    .dots { display: flex; gap: 4px; align-items: center; }
    .dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--borde); }
    .dots small { margin-left: 4px; font-size: 0.6875rem; color: var(--texto-sec); }
    .note { font-size: 0.8125rem; line-height: 1.5; color: var(--madera); white-space: pre-wrap; }
    .cta { padding: 0 16px; }
  `,
  template: `
    <mv-header title="Mis estados de ánimo" back="/perfil" />

    <div class="screen-body with-nav">
      @if (groups().length) {
        <div class="content">
          <p class="summary">
            <span class="emotive">Cada registro es un paso.</span><br />
            Llevas {{ total() }} {{ total() === 1 ? 'registro' : 'registros' }} de cómo te sientes.
          </p>
          @for (g of groups(); track g.key) {
            <section class="month">
              <h2 class="section-title">{{ g.date | date: 'MMMM y' }}</h2>
              <div class="list">
                @for (l of g.logs; track l.id) {
                  @let e = emotions[l.emotion];
                  <article class="card log">
                    <span class="emo" [style.background]="e.color + '33'" aria-hidden="true">{{ e.emoji }}</span>
                    <div class="body">
                      <div class="top">
                        <span class="label" [style.color]="e.color">{{ e.label }}</span>
                        <span class="when">{{ l.date | date: 'EEE d MMM' }} · {{ l.createdAt | date: 'HH:mm' }}</span>
                      </div>
                      <span class="dots" role="img" [attr.aria-label]="'Intensidad ' + l.intensity + ' de 5'">
                        @for (i of scale; track i) {
                          <i [style.background]="i <= l.intensity ? e.color : null"></i>
                        }
                        <small>{{ l.intensity }}/5</small>
                      </span>
                      @if (l.note) {
                        <p class="note">{{ l.note }}</p>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <mv-empty-state
          emoji="🌤️"
          title="Aún no registras cómo te sientes"
          message="Ponerle nombre a lo que sientes es una forma de cuidarte. Puedes hacerlo cuando quieras."
        >
          <a class="btn-primary" routerLink="/duelo">Ir a Mi Duelo</a>
        </mv-empty-state>
      }
    </div>
  `,
})
export class Moods {
  private readonly grief = inject(GriefStore);

  protected readonly emotions = EMOTION_BY_ID;
  protected readonly scale = [1, 2, 3, 4, 5];
  protected readonly total = computed(() => this.grief.logs().length);

  /** Registros agrupados por mes (ya vienen ordenados del más reciente al más antiguo). */
  protected readonly groups = computed<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const l of this.grief.logs()) {
      const d = new Date(l.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = map.get(key);
      if (!g) {
        g = { key, date: new Date(d.getFullYear(), d.getMonth(), 1), logs: [] };
        map.set(key, g);
      }
      g.logs.push(l);
    }
    return [...map.values()];
  });
}
