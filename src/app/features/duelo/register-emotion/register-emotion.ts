import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { EMOTION_BY_ID } from '../../../core/data/catalog';
import { EmotionId } from '../../../core/data/models';
import { GriefStore } from '../../../core/services/grief';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { Slider } from '../../../shared/slider';

const INTENSITY = ['Leve', 'Suave', 'Moderada', 'Intensa', 'Muy intensa'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const NOTE_MAX = 500;

interface DayCell {
  date: Date;
  day: number;
  future: boolean;
  today: boolean;
}

/** Fecha local a medianoche. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Registrar emoción: día, intensidad y nota. */
@Component({
  selector: 'mv-register-emotion',
  imports: [Header, Icon, Slider, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }
    .chosen { display: flex; align-items: center; gap: 14px; }
    .circle {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 64px; height: 64px; border-radius: 50%; font-size: 2rem;
    }
    .chosen h2 { font-family: var(--font-titulo); font-size: 1.375rem; font-weight: 600; }
    .chosen p { font-family: var(--font-emotivo); font-size: 1.125rem; color: var(--terracota); }

    .cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .cal-head h3 { font-family: var(--font-titulo); font-size: 1rem; font-weight: 600; text-transform: capitalize; }
    .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
    .wd { font-size: 0.6875rem; font-weight: 600; color: var(--texto-sec); padding: 4px 0; }
    .day {
      display: flex; align-items: center; justify-content: center;
      height: 40px; border-radius: 50%; font-size: 0.875rem; color: var(--madera);
      position: relative;
    }
    .day:hover:not(:disabled) { background: var(--fondo); }
    .day.today { font-weight: 700; color: var(--terracota); }
    .day.logged::after {
      content: ''; position: absolute; bottom: 4px; width: 4px; height: 4px; border-radius: 50%; background: var(--verde);
    }
    .day.selected { background: var(--terracota); color: var(--blanco); font-weight: 600; }
    .day.selected::after { background: var(--blanco); }
    .day:disabled { color: var(--borde); cursor: not-allowed; }
    .picked { margin-top: 8px; font-size: 0.8125rem; color: var(--texto-sec); text-align: center; }

    .intensity-head { display: flex; justify-content: space-between; align-items: baseline; }
    .intensity-value { font-size: 0.875rem; font-weight: 600; color: var(--terracota); }
    .scale { display: flex; justify-content: space-between; margin-top: 6px; }
    .scale span { font-size: 0.625rem; color: var(--texto-sec); width: 20%; text-align: center; }
    .scale span:first-child { text-align: left; }
    .scale span:last-child { text-align: right; }
    .scale span.on { color: var(--madera); font-weight: 600; }

    .textarea { height: 120px; }
    .counter { margin-top: 4px; font-size: 0.75rem; color: var(--texto-sec); text-align: right; }
    .counter.over { color: var(--terracota); }
  `,
  template: `
    <mv-header title="Registrar emoción" back="/duelo" />

    <div class="screen-body with-nav">
      @if (info(); as e) {
        <form class="content" (submit)="$event.preventDefault(); save()" novalidate>
          <div class="chosen">
            <span class="circle" [style.background]="e.color + '33'" aria-hidden="true">{{ e.emoji }}</span>
            <div>
              <h2>{{ e.label }}</h2>
              <p>Gracias por ponerle nombre a lo que sientes</p>
            </div>
          </div>

          <!-- Calendario para elegir el día -->
          <section class="card" aria-labelledby="cal-title">
            <div class="cal-head">
              <button type="button" class="icon-btn" aria-label="Mes anterior" (click)="shiftMonth(-1)">
                <mv-icon name="chevron-left" [size]="20" />
              </button>
              <h3 id="cal-title" aria-live="polite">{{ month() | date: 'MMMM y' }}</h3>
              <button type="button" class="icon-btn" aria-label="Mes siguiente" [disabled]="isCurrentMonth()" (click)="shiftMonth(1)">
                <mv-icon name="chevron-right" [size]="20" />
              </button>
            </div>
            <div class="cal" role="group" aria-labelledby="cal-title">
              @for (w of weekdays; track $index) {
                <span class="wd" aria-hidden="true">{{ w }}</span>
              }
              @for (cell of cells(); track $index) {
                @if (cell) {
                  <button type="button" class="btn-reset day"
                    [class.today]="cell.today"
                    [class.selected]="isSelected(cell)"
                    [class.logged]="loggedDays().has(cell.date.toDateString())"
                    [disabled]="cell.future"
                    [attr.aria-pressed]="isSelected(cell)"
                    [attr.aria-label]="dayLabel(cell)"
                    (click)="day.set(cell.date)">{{ cell.day }}</button>
                } @else {
                  <span aria-hidden="true"></span>
                }
              }
            </div>
            <p class="picked">Registrando para el {{ day() | date: "EEEE d 'de' MMMM" }}</p>
          </section>

          <section class="card">
            <div class="intensity-head">
              <span class="field-label" id="int-label">¿Con qué intensidad?</span>
              <span class="intensity-value">{{ intensityLabel() }}</span>
            </div>
            <div role="group" aria-labelledby="int-label"><mv-slider [(value)]="intensity" [min]="1" [max]="5" /></div>
            <div class="scale" aria-hidden="true">
              @for (l of levels; track l; let i = $index) {
                <span [class.on]="i + 1 === intensity()">{{ l }}</span>
              }
            </div>
          </section>

          <section>
            <label class="field-label" for="note">¿Quieres contarme más?</label>
            <textarea id="note" class="textarea" [value]="note()" (input)="note.set($any($event.target).value)"
              placeholder="Lo que pasó hoy, un recuerdo, una palabra…" aria-describedby="note-count"></textarea>
            <p id="note-count" class="counter" [class.over]="noteTooLong()">{{ note().length }}/{{ noteMax }}</p>
            @if (noteTooLong()) {
              <p class="error-text" role="alert">Tu nota es un poco larga; intenta resumirla en {{ noteMax }} caracteres.</p>
            }
          </section>

          <button type="submit" class="btn-primary" [disabled]="noteTooLong()">Guardar</button>
        </form>
      }
    </div>
  `,
})
export class RegisterEmotion {
  private readonly grief = inject(GriefStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  readonly emocion = input.required<string>();

  protected readonly weekdays = WEEKDAYS;
  protected readonly levels = INTENSITY;
  protected readonly noteMax = NOTE_MAX;

  protected readonly info = computed(() => EMOTION_BY_ID[this.emocion() as EmotionId] ?? null);

  private readonly today = startOfDay(new Date());
  protected readonly day = signal<Date>(this.today);
  /** Primer día del mes visible. */
  protected readonly month = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly intensity = signal(3);
  protected readonly note = signal('');

  protected readonly intensityLabel = computed(() => INTENSITY[this.intensity() - 1]);
  protected readonly noteTooLong = computed(() => this.note().length > NOTE_MAX);
  protected readonly isCurrentMonth = computed(() => {
    const m = this.month();
    return m.getFullYear() === this.today.getFullYear() && m.getMonth() === this.today.getMonth();
  });

  /** Días con registros, para marcarlos con un punto. */
  protected readonly loggedDays = computed(() => new Set(this.grief.logs().map(l => new Date(l.date).toDateString())));

  /** Celdas del mes (lunes primero); null = hueco antes del día 1. */
  protected readonly cells = computed<(DayCell | null)[]>(() => {
    const m = this.month();
    const offset = (m.getDay() + 6) % 7;
    const total = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const cells: (DayCell | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= total; d++) {
      const date = new Date(m.getFullYear(), m.getMonth(), d);
      cells.push({ date, day: d, future: date > this.today, today: date.getTime() === this.today.getTime() });
    }
    return cells;
  });

  constructor() {
    // Emoción desconocida: volver a Mi Duelo.
    effect(() => {
      if (!this.info()) this.router.navigateByUrl('/duelo', { replaceUrl: true });
    });
  }

  protected shiftMonth(delta: number): void {
    const m = this.month();
    const next = new Date(m.getFullYear(), m.getMonth() + delta, 1);
    if (next > this.today) return;
    this.month.set(next);
  }

  protected isSelected(cell: DayCell): boolean {
    return cell.date.getTime() === this.day().getTime();
  }

  protected dayLabel(cell: DayCell): string {
    const d = cell.date;
    const name = WEEKDAY_NAMES[(d.getDay() + 6) % 7];
    return `${name} ${d.getDate()}${cell.today ? ', hoy' : ''}${cell.future ? ', no disponible' : ''}`;
  }

  protected save(): void {
    const e = this.info();
    if (!e || this.noteTooLong()) return;
    const d = this.day();
    // Hoy: la hora actual. Otro día: mediodía, para que no cambie de fecha por zona horaria.
    const date = d.getTime() === this.today.getTime() ? new Date() : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    this.grief.logEmotion(e.id, this.intensity(), this.note(), date.toISOString());
    this.ui.toast('Registro guardado');
    this.router.navigateByUrl('/duelo/historial');
  }
}
