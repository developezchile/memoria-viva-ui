import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RITUALS } from '../../../core/data/catalog';
import { CalendarStore } from '../../../core/services/calendar';
import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';
import { EVENT_KIND } from '../event-kinds';

/** Detalle del evento: participantes, seres queridos, rituales y compartir en el muro. */
@Component({
  selector: 'mv-event-detail',
  imports: [DatePipe, RouterLink, Header, Icon, PersonAvatar, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .hero { border-radius: 16px; padding: 20px; }
    .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #fff; }
    h2 { margin: 12px 0 8px; font-family: var(--font-titulo); font-size: 1.5rem; line-height: 1.25; color: var(--madera); }
    .when { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--casa); }
    .when::first-letter { text-transform: uppercase; }
    .desc { margin-top: 12px; font-size: 0.9375rem; line-height: 1.6; color: var(--madera); white-space: pre-line; }
    .block { margin-top: 24px; }
    .people { display: flex; flex-direction: column; gap: 10px; }
    .person { display: flex; align-items: center; gap: 12px; font-size: 0.9375rem; color: var(--madera); }
    .memorials { display: flex; flex-wrap: wrap; gap: 16px; }
    .memorial {
      display: flex; flex-direction: column; align-items: center; gap: 6px; width: 84px;
      text-decoration: none; text-align: center; font-size: 0.8125rem; color: var(--madera);
    }
    .memorial .emotive { font-size: 1rem; line-height: 1.1; }
    .list { padding: 0; overflow: hidden; border-radius: 16px; }
    .ritual-emoji {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 40px; height: 40px; border-radius: 12px; background: var(--crema); font-size: 1.25rem;
    }
    .grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .row-title { font-weight: 600; }
    .row-sub { font-size: 0.8125rem; color: var(--texto-sec); }
    .muted { font-size: 0.875rem; color: var(--texto-sec); line-height: 1.5; }
    .actions { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    .delete { display: block; margin: 24px auto 0; }
    a.btn-primary, a.btn-secondary { text-decoration: none; }
  `,
  template: `
    @let ev = event();
    <mv-header [title]="ev ? 'Evento' : 'Evento no encontrado'" back="/calendario" />
    <div class="screen-body with-nav">
      @if (ev) {
        @let kind = kindOf[ev.kind];
        <section class="card hero">
          <span class="badge" [style.background]="kind.color">{{ kind.emoji }} {{ kind.label }}</span>
          <h2>{{ ev.title }}</h2>
          <p class="when">
            <mv-icon name="clock" [size]="16" color="#7C563D" />
            <span>{{ ev.date | date: "EEEE d 'de' MMMM 'de' y, HH:mm" }} h</span>
          </p>
          @if (ev.description) {
            <p class="desc">{{ ev.description }}</p>
          }
        </section>

        @if (ev.memorialIds.length) {
          <section class="block" aria-labelledby="mem-title">
            <h3 id="mem-title" class="section-title">En memoria de</h3>
            <div class="memorials">
              @for (id of ev.memorialIds; track id) {
                <a class="memorial" [routerLink]="['/memorial', id]">
                  <mv-person-avatar [id]="id" [size]="64" />
                  <span class="emotive">{{ family.nameOf(id) }}</span>
                </a>
              }
            </div>
          </section>
        }

        <section class="block" aria-labelledby="part-title">
          <h3 id="part-title" class="section-title">Participantes ({{ ev.participantIds.length }})</h3>
          @if (ev.participantIds.length) {
            <div class="people">
              @for (id of ev.participantIds; track id) {
                <div class="person"><mv-person-avatar [id]="id" [size]="36" /> {{ family.nameOf(id) }}</div>
              }
            </div>
          } @else {
            <p class="muted">Aún no hay participantes. Todos están invitados.</p>
          }
        </section>

        <section class="block" aria-labelledby="rit-title">
          <h3 id="rit-title" class="section-title">Rituales</h3>
          @if (rituals().length) {
            <div class="card list">
              @for (r of rituals(); track r.id) {
                <div class="list-row">
                  <span class="ritual-emoji" aria-hidden="true">{{ r.emoji }}</span>
                  <span class="grow">
                    <span class="row-title">{{ r.title }}</span>
                    <span class="row-sub">{{ r.minutes }} min</span>
                  </span>
                  <button type="button" class="icon-btn" [attr.aria-label]="'Quitar ritual ' + r.title" (click)="removeRitual(r.id, r.title)">
                    <mv-icon name="x" [size]="18" color="#A89070" />
                  </button>
                </div>
              }
            </div>
          } @else {
            <p class="muted">Un pequeño gesto puede darle sentido al día: una vela, su plato favorito, una visita al jardín.</p>
          }
        </section>

        <div class="actions">
          <a class="btn-secondary" routerLink="/calendario/rituales" [queryParams]="{ evento: ev.id }">
            <mv-icon name="plus" color="#A0503E" [size]="18" /> Añadir ritual
          </a>
          <button type="button" class="btn-primary" (click)="share()">
            <mv-icon name="share" color="#FFFFFF" [size]="18" /> Compartir con la familia
          </button>
        </div>

        @if (canDelete()) {
          <button type="button" class="btn-link delete" (click)="remove()">Eliminar evento</button>
        }
      } @else {
        <mv-empty-state emoji="🍂" title="No encontramos este evento" message="Puede que se haya eliminado o que el enlace no sea correcto.">
          <a class="btn-primary" routerLink="/calendario">Volver al calendario</a>
        </mv-empty-state>
      }
    </div>
  `,
})
export class EventDetail {
  private readonly cal = inject(CalendarStore);
  protected readonly family = inject(FamilyStore);
  private readonly feed = inject(FeedStore);
  private readonly session = inject(Session);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);

  readonly id = input.required<string>();

  protected readonly kindOf = EVENT_KIND;
  protected readonly event = computed(() => this.cal.event(this.id()));
  protected readonly rituals = computed(() => {
    const ids = this.event()?.ritualIds ?? [];
    return RITUALS.filter(r => ids.includes(r.id));
  });
  /** Solo quien lo creó o un administrador puede eliminarlo. */
  protected readonly canDelete = computed(() => {
    const ev = this.event();
    return !!ev && (ev.createdBy === this.session.meId() || !!this.session.me()?.isAdmin);
  });

  protected removeRitual(ritualId: string, title: string): void {
    this.cal.toggleRitual(this.id(), ritualId);
    this.ui.toast(`Quitaste "${title}"`);
  }

  protected async share(): Promise<void> {
    const ev = this.event();
    if (!ev) return;
    const fecha = formatDate(ev.date, "EEEE d 'de' MMMM, HH:mm", this.locale);
    const text = `📅 ${ev.title} — ${fecha}. ${ev.description}`.trim();
    const post = await this.ui.withLoading('Compartiendo con tu familia…', () =>
      this.feed.create({ text, taggedIds: [...new Set([...ev.memorialIds, ...ev.participantIds])] }),
    );
    this.router.navigate(['/familia/publicado', post.id]);
  }

  protected async remove(): Promise<void> {
    const ev = this.event();
    if (!ev) return;
    const ok = await this.ui.confirm({
      title: '¿Eliminar este evento?',
      message: `"${ev.title}" desaparecerá del calendario de toda la familia.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.cal.deleteEvent(ev.id);
    this.ui.toast('Evento eliminado');
    this.router.navigateByUrl('/calendario');
  }
}
