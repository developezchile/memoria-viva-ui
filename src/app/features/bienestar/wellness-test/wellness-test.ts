import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { WELLNESS_QUESTIONS, WELLNESS_SCALE } from '../../../core/data/catalog';
import { WellnessStore } from '../../../core/services/wellness';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';

const FACES = ['😞', '🙁', '😐', '🙂', '😊'];

/** Test de bienestar: 5 preguntas con escala 1–5. */
@Component({
  selector: 'mv-wellness-test',
  imports: [RouterLink, Header, Icon, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .intro h2 { font-family: var(--font-titulo); font-size: 1.375rem; color: var(--madera); }
    .intro p { margin-top: 6px; font-size: 0.9375rem; line-height: 1.5; color: var(--casa); }
    .intro .emotive { display: block; margin-top: 4px; font-size: 1.25rem; }
    .last {
      display: flex; align-items: center; gap: 12px; margin-top: 16px;
      border-radius: 16px; text-decoration: none; color: var(--madera); font-size: 0.875rem;
    }
    .last strong { font-weight: 700; }
    .last span { flex: 1; }
    .progress { position: sticky; top: 0; z-index: 1; margin: 16px -16px 0; padding: 10px 16px; background: var(--fondo); }
    .progress-label { display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--texto-sec); margin-bottom: 6px; }
    .bar { height: 6px; border-radius: 3px; background: var(--borde); overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--verde); border-radius: 3px; transition: width 0.25s ease; }
    .q { margin-top: 16px; border-radius: 16px; }
    .q-title { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; color: var(--madera); }
    .q-num { display: block; font-family: var(--font-cuerpo); font-size: 0.75rem; font-weight: 600; color: var(--texto-sec); margin-bottom: 4px; }
    .scale { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 14px; }
    .opt {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      min-height: 72px; padding: 8px 2px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid var(--borde); background: #fff;
      font-family: var(--font-cuerpo); color: var(--madera);
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .opt .face { font-size: 1.5rem; line-height: 1; }
    .opt .lbl { font-size: 0.625rem; line-height: 1.2; text-align: center; }
    .opt.on { border-color: var(--verde); background: var(--verde); color: #fff; font-weight: 600; }
    .opt:focus-visible { outline: 2px solid var(--arcilla); outline-offset: 2px; }
    .submit { margin-top: 24px; }
    .hint { margin-top: 8px; text-align: center; font-size: 0.8125rem; color: var(--texto-sec); }
  `,
  template: `
    <mv-header title="Mi Bienestar">
      <a class="icon-btn" routerLink="/bienestar/especialistas" aria-label="Directorio de especialistas">
        <mv-icon name="people" [size]="22" />
      </a>
    </mv-header>
    <div class="screen-body with-nav">
      <section class="intro">
        <h2>¿Cómo estás de verdad?</h2>
        <p>Cinco preguntas breves para mirar cómo te encuentras. No hay respuestas correctas; solo es para ti.</p>
        <span class="emotive">Cuidarte también es honrar su memoria.</span>
      </section>

      @if (store.latest(); as last) {
        <a class="card last" routerLink="/bienestar/resultado">
          <mv-icon name="heart" [size]="20" color="#737B4C" />
          <span>Tu último resultado: <strong>{{ last.score }}/100</strong> · {{ last.createdAt | timeAgo }}</span>
          <mv-icon name="chevron-right" [size]="18" color="#A89070" />
        </a>
      }

      <div class="progress" aria-live="polite">
        <div class="progress-label"><span>Progreso</span><span>{{ answered() }}/{{ questions.length }}</span></div>
        <div class="bar" role="progressbar" [attr.aria-valuenow]="answered()" aria-valuemin="0" [attr.aria-valuemax]="questions.length"
          aria-label="Preguntas respondidas">
          <i [style.width.%]="(answered() / questions.length) * 100"></i>
        </div>
      </div>

      @for (q of questions; track $index; let qi = $index) {
        <section class="card q">
          <h3 class="q-title" [id]="'q-' + qi"><span class="q-num">Pregunta {{ qi + 1 }} de {{ questions.length }}</span>{{ q }}</h3>
          <div class="scale" role="radiogroup" [attr.aria-labelledby]="'q-' + qi">
            @for (label of scale; track $index; let vi = $index) {
              @let on = answers()[qi] === vi + 1;
              <button type="button" role="radio" class="opt" [class.on]="on" [attr.aria-checked]="on"
                [attr.aria-label]="label" (click)="answer(qi, vi + 1)">
                <span class="face" aria-hidden="true">{{ faces[vi] }}</span>
                <span class="lbl" aria-hidden="true">{{ label }}</span>
              </button>
            }
          </div>
        </section>
      }

      <div class="submit">
        <button type="button" class="btn-primary" [disabled]="!complete()" (click)="submit()">Ver resultados</button>
        @if (!complete()) {
          <p class="hint">Responde las {{ questions.length }} preguntas para ver tu resultado.</p>
        }
      </div>
    </div>
  `,
})
export class WellnessTest {
  protected readonly store = inject(WellnessStore);
  private readonly router = inject(Router);

  protected readonly questions = WELLNESS_QUESTIONS;
  protected readonly scale = WELLNESS_SCALE;
  protected readonly faces = FACES;

  protected readonly answers = signal<(number | null)[]>(WELLNESS_QUESTIONS.map(() => null));
  protected readonly answered = computed(() => this.answers().filter(a => a !== null).length);
  protected readonly complete = computed(() => this.answered() === this.questions.length);

  protected answer(index: number, value: number): void {
    this.answers.update(list => list.map((a, i) => (i === index ? value : a)));
  }

  protected submit(): void {
    if (!this.complete()) return;
    this.store.submit(this.answers() as number[]);
    this.router.navigateByUrl('/bienestar/resultado');
  }
}
