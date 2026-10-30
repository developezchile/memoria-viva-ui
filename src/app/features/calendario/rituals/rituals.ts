import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RITUALS } from '../../../core/data/catalog';
import { CalendarEvent, Ritual } from '../../../core/data/models';
import { CalendarStore } from '../../../core/services/calendar';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { Sheet } from '../../../shared/sheet';

/** Galería de rituales. Con `?evento=` permite añadirlos o quitarlos de ese evento. */
@Component({
  selector: 'mv-rituals',
  imports: [DatePipe, RouterLink, Header, Icon, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .intro { margin-bottom: 16px; font-size: 0.9375rem; line-height: 1.5; color: var(--casa); }
    .for {
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 14px;
      border-radius: 12px; background: var(--crema); font-size: 0.875rem; color: var(--madera);
    }
    .for strong { font-weight: 600; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .ritual { display: flex; align-items: center; gap: 14px; width: 100%; border-radius: 16px; }
    .ritual.added { box-shadow: 0 0 0 2px var(--verde), var(--sombra-card); }
    .emoji {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 52px; height: 52px; border-radius: 14px; background: var(--crema); font-size: 1.625rem;
    }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .title { font-family: var(--font-titulo); font-size: 1rem; font-weight: 600; color: var(--madera); }
    .desc { font-size: 0.8125rem; line-height: 1.4; color: var(--casa); }
    .min { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--texto-sec); }
    .toggle {
      flex-shrink: 0; min-height: 40px; min-width: 88px; padding: 0 12px; border-radius: 20px; cursor: pointer;
      border: 1.5px solid var(--terracota); background: #fff; color: var(--terracota);
      font-family: var(--font-cuerpo); font-size: 0.8125rem; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    }
    .toggle.on { border-color: var(--verde); background: var(--verde); color: #fff; }
    .done-bar { margin-top: 20px; }
    .sheet-emoji { font-size: 3rem; text-align: center; }
    .sheet-desc { margin: 8px 0 4px; text-align: center; font-size: 0.9375rem; line-height: 1.5; color: var(--madera); }
    .sheet-min { text-align: center; font-size: 0.8125rem; color: var(--texto-sec); }
    .pick-title { margin: 20px 0 8px; }
    .events { padding: 0; overflow: hidden; border-radius: 16px; }
    .ev-sub { font-size: 0.75rem; color: var(--texto-sec); }
    .ev-sub::first-letter { text-transform: uppercase; }
    .muted { font-size: 0.875rem; color: var(--texto-sec); line-height: 1.5; }
    a.btn-primary { text-decoration: none; }
  `,
  template: `
    @let ev = event();
    <mv-header title="Galería de rituales" [back]="ev ? '/calendario/evento/' + ev.id : '/calendario'" />
    <div class="screen-body with-nav">
      @if (ev) {
        <p class="for"><mv-icon name="calendar" [size]="18" color="#7C563D" /> <span>Para: <strong>{{ ev.title }}</strong></span></p>
      } @else {
        <p class="intro">Pequeños gestos para honrar a quienes amamos. Toca un ritual para conocerlo y sumarlo a un evento.</p>
      }

      <ul class="list" role="list">
        @for (r of rituals; track r.id) {
          @let added = !!ev && ev.ritualIds.includes(r.id);
          <li>
            @if (ev) {
              <div class="card ritual" [class.added]="added">
                <span class="emoji" aria-hidden="true">{{ r.emoji }}</span>
                <span class="grow">
                  <span class="title">{{ r.title }}</span>
                  <span class="desc">{{ r.description }}</span>
                  <span class="min"><mv-icon name="clock" [size]="12" color="#A89070" /> {{ r.minutes }} min</span>
                </span>
                <button type="button" class="toggle" [class.on]="added" [attr.aria-pressed]="added"
                  [attr.aria-label]="(added ? 'Quitar ' : 'Añadir ') + r.title" (click)="toggle(ev, r)">
                  @if (added) { <mv-icon name="check" [size]="14" color="#FFFFFF" /> Añadido } @else { + Añadir }
                </button>
              </div>
            } @else {
              <button type="button" class="btn-reset card ritual" (click)="detail.set(r)">
                <span class="emoji" aria-hidden="true">{{ r.emoji }}</span>
                <span class="grow">
                  <span class="title">{{ r.title }}</span>
                  <span class="desc">{{ r.description }}</span>
                  <span class="min"><mv-icon name="clock" [size]="12" color="#A89070" /> {{ r.minutes }} min</span>
                </span>
                <mv-icon name="chevron-right" [size]="18" color="#A89070" />
              </button>
            }
          </li>
        }
      </ul>

      @if (ev) {
        <div class="done-bar">
          <a class="btn-primary" [routerLink]="['/calendario/evento', ev.id]">Listo ({{ ev.ritualIds.length }})</a>
        </div>
      }
    </div>

    @let r = detail();
    <mv-sheet [open]="!!r" [title]="r?.title ?? ''" (closed)="detail.set(null)">
      @if (r) {
        <div class="sheet-emoji" aria-hidden="true">{{ r.emoji }}</div>
        <p class="sheet-desc">{{ r.description }}</p>
        <p class="sheet-min">Duración aproximada: {{ r.minutes }} min</p>

        <h3 class="section-title pick-title">Agregar a un evento</h3>
        @if (upcoming().length) {
          <div class="card events">
            @for (e of upcoming(); track e.id) {
              @let has = e.ritualIds.includes(r.id);
              <button type="button" class="list-row" [attr.aria-pressed]="has" (click)="toggle(e, r)">
                <span style="flex: 1; display: flex; flex-direction: column; gap: 2px">
                  <span style="font-weight: 600">{{ e.title }}</span>
                  <span class="ev-sub">{{ e.date | date: "EEEE d 'de' MMMM" }}</span>
                </span>
                @if (has) {
                  <mv-icon name="check" [size]="20" color="#737B4C" />
                } @else {
                  <mv-icon name="plus" [size]="20" color="#A0503E" />
                }
              </button>
            }
          </div>
        } @else {
          <p class="muted">No hay eventos próximos. Crea uno desde el calendario.</p>
          <a class="btn-primary" routerLink="/calendario" style="margin-top: 12px">Ir al calendario</a>
        }
      }
    </mv-sheet>
  `,
})
export class Rituals {
  private readonly cal = inject(CalendarStore);
  private readonly ui = inject(Ui);

  /** Query `?evento=` opcional. */
  readonly evento = input<string>();

  protected readonly rituals = RITUALS;
  protected readonly event = computed(() => {
    const id = this.evento();
    return id ? this.cal.event(id) : undefined;
  });
  protected readonly upcoming = computed(() => this.cal.upcoming().slice(0, 6));
  protected readonly detail = signal<Ritual | null>(null);

  protected toggle(ev: CalendarEvent, r: Ritual): void {
    const had = ev.ritualIds.includes(r.id);
    this.cal.toggleRitual(ev.id, r.id);
    this.ui.toast(had ? `Quitaste "${r.title}" de ${ev.title}` : `"${r.title}" añadido a ${ev.title}`);
  }
}
