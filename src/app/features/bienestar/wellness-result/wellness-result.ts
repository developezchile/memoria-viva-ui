import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WELLNESS_QUESTIONS, WELLNESS_SCALE } from '../../../core/data/catalog';
import { WellnessStore } from '../../../core/services/wellness';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

/** Tu Bienestar: gráfico circular del puntaje, detalle por pregunta y acciones. */
@Component({
  selector: 'mv-wellness-result',
  imports: [DatePipe, RouterLink, Header, Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; border-radius: 16px; padding: 24px 20px; }
    .donut { position: relative; width: 160px; height: 160px; }
    .donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .donut circle { fill: none; stroke-width: 14; }
    .donut .track { stroke: var(--crema); }
    .donut .value { stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
    .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score { font-family: var(--font-titulo); font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .of { font-size: 0.8125rem; color: var(--texto-sec); }
    .date { margin-top: 8px; font-size: 0.75rem; color: var(--texto-sec); }
    h2 { margin-top: 16px; font-family: var(--font-titulo); font-size: 1.25rem; color: var(--madera); }
    .msg { margin-top: 8px; font-size: 0.9375rem; line-height: 1.55; color: var(--casa); }
    .compare {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 4px 12px;
      border-radius: 20px; background: var(--fondo); font-size: 0.8125rem; color: var(--madera);
    }
    .block { margin-top: 24px; }
    .bars { display: flex; flex-direction: column; gap: 14px; border-radius: 16px; }
    .bar-q { display: flex; justify-content: space-between; gap: 8px; font-size: 0.8125rem; color: var(--madera); margin-bottom: 6px; }
    .bar-q b { flex-shrink: 0; font-weight: 600; color: var(--casa); }
    .track-h { height: 10px; border-radius: 5px; background: var(--crema); overflow: hidden; }
    .track-h i { display: block; height: 100%; border-radius: 5px; }
    .help {
      margin-top: 16px; padding: 14px 16px; border-radius: 16px;
      background: rgba(160, 80, 62, 0.08); border: 1px solid rgba(160, 80, 62, 0.25);
      font-size: 0.875rem; line-height: 1.5; color: var(--madera);
    }
    .help a { color: var(--terracota); font-weight: 700; }
    .actions { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    a.btn-primary, a.btn-secondary { text-decoration: none; }
    .again { display: block; margin: 16px auto 0; }
  `,
  template: `
    <mv-header title="Tu Bienestar" back="/bienestar" />
    <div class="screen-body with-nav">
      @if (result(); as r) {
        @let rd = reading()!;
        <section class="card hero">
          <div class="donut" role="img" [attr.aria-label]="'Puntaje de bienestar: ' + r.score + ' de 100. ' + rd.title">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="track" cx="60" cy="60" [attr.r]="radius" />
              <circle class="value" cx="60" cy="60" [attr.r]="radius" [attr.stroke]="rd.color"
                [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="offset()" />
            </svg>
            <div class="center" aria-hidden="true">
              <span class="score" [style.color]="rd.color">{{ r.score }}</span>
              <span class="of">de 100</span>
            </div>
          </div>
          <p class="date">{{ r.createdAt | date: "d 'de' MMMM, HH:mm" }}</p>
          <h2>{{ rd.title }}</h2>
          <p class="msg">{{ rd.message }}</p>
          @if (diff(); as d) {
            <p class="compare">
              @if (d > 0) { ↑ Subió {{ d }} puntos desde tu resultado anterior }
              @else if (d < 0) { ↓ Bajó {{ -d }} puntos desde tu resultado anterior }
            </p>
          } @else if (previous()) {
            <p class="compare">Igual que tu resultado anterior</p>
          }
        </section>

        @if (r.score < 40) {
          <p class="help" role="note">
            Si sientes que no puedes más o tienes pensamientos de hacerte daño, no estás sola ni solo.
            Llama a <strong>Salud Responde</strong> al <a href="tel:6003607777">600 360 7777</a>, disponible las 24 horas.
          </p>
        }

        <section class="block" aria-labelledby="detail-title">
          <h3 id="detail-title" class="section-title">Tus respuestas</h3>
          <div class="card bars">
            @for (q of questions; track $index; let i = $index) {
              @let v = r.answers[i];
              <div>
                <div class="bar-q"><span>{{ q }}</span><b>{{ scale[v - 1] }}</b></div>
                <div class="track-h" role="img" [attr.aria-label]="q + ' ' + scale[v - 1] + ', ' + v + ' de 5'">
                  <i [style.width.%]="(v / 5) * 100" [style.background]="v <= 2 ? '#A0503E' : v === 3 ? '#D4A843' : '#737B4C'"></i>
                </div>
              </div>
            }
          </div>
        </section>

        <div class="actions">
          <a class="btn-primary" routerLink="/bienestar/especialistas">
            <mv-icon name="message" color="#FFFFFF" [size]="18" /> Contactar psicólogo
          </a>
          <a class="btn-secondary" routerLink="/duelo/recursos">
            <mv-icon name="book" color="#A0503E" [size]="18" /> Ver recursos
          </a>
        </div>
        <a class="btn-link again" routerLink="/bienestar">Repetir test</a>
      } @else {
        <mv-empty-state emoji="🌿" title="Aún no tienes resultados" message="Responde el test de bienestar para ver cómo te encuentras y recibir recomendaciones.">
          <a class="btn-primary" routerLink="/bienestar">Hacer el test</a>
        </mv-empty-state>
      }
    </div>
  `,
})
export class WellnessResultPage {
  private readonly store = inject(WellnessStore);

  protected readonly questions = WELLNESS_QUESTIONS;
  protected readonly scale = WELLNESS_SCALE;
  protected readonly radius = RADIUS;
  protected readonly circ = CIRC;

  protected readonly result = this.store.latest;
  protected readonly previous = computed(() => this.store.myResults()[1]);
  protected readonly reading = computed(() => {
    const r = this.result();
    return r ? this.store.reading(r.score) : null;
  });
  protected readonly offset = computed(() => CIRC * (1 - (this.result()?.score ?? 0) / 100));
  /** Diferencia con el resultado anterior (0 o undefined si no aplica). */
  protected readonly diff = computed(() => {
    const prev = this.previous();
    const cur = this.result();
    return prev && cur ? cur.score - prev.score : 0;
  });
}
