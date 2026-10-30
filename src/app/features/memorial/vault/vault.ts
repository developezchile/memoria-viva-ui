import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TimeMessage } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { MemorialStore } from '../../../core/services/memorials';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { daysUntil, toDate } from '../dates';

type VaultState = 'open' | 'locked' | 'other';

const FORMAT_LABEL: Record<TimeMessage['format'], string> = { audio: '🎙️ Audio', video: '🎬 Video', texto: '✉️ Carta' };

/** Bóveda del tiempo: mensajes que un ser querido dejó para abrirse en una fecha. */
@Component({
  selector: 'mv-vault',
  imports: [DatePipe, RouterLink, EmptyState, Header, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .intro {
      margin: 16px; padding: 20px; border-radius: 16px; text-align: center;
      background: linear-gradient(160deg, var(--madera), var(--casa)); color: var(--crema);
    }
    .intro .ic {
      display: inline-flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; margin-bottom: 8px; border-radius: 50%; border: 1.5px solid var(--dorado);
    }
    .intro .emotive { font-size: 1.5rem; line-height: 1.2; color: var(--dorado); }
    .intro p { margin-top: 6px; font-size: 0.875rem; line-height: 1.55; opacity: 0.92; }
    ul { list-style: none; margin: 0; padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }
    .msg {
      display: flex; align-items: center; gap: 14px; width: 100%; padding: 16px; min-height: 80px;
      border-radius: 16px; border: 1.5px solid transparent; background: var(--blanco); box-shadow: var(--sombra-card);
      font-family: var(--font-cuerpo); color: var(--madera); text-align: left; text-decoration: none; cursor: pointer;
    }
    .msg.open { border-color: var(--dorado); }
    .msg.locked, .msg.other { background: #faf6ef; box-shadow: none; border: 1.5px dashed var(--borde); }
    .lock {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 48px; height: 48px; border-radius: 50%; background: var(--crema);
    }
    .open .lock { background: rgba(212, 168, 67, 0.18); }
    .info { flex: 1; min-width: 0; }
    .title { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; }
    .sub { font-size: 0.8125rem; color: var(--texto-sec); }
    .fmt { font-size: 0.75rem; color: var(--texto-sec); }
    .left { display: inline-block; margin-top: 4px; }
    .chip { background: var(--crema); color: var(--casa); }
  `,
  template: `
    @let m = memorial();
    <mv-header title="Bóveda del tiempo" [back]="'/memorial/' + id()" />

    <div class="screen-body with-nav">
      <section class="intro">
        <span class="ic"><mv-icon name="lock" color="#D4A843" /></span>
        <p class="emotive">Palabras que esperan su momento</p>
        <p>
          {{ m ? m.name : 'Tu ser querido' }} dejó mensajes guardados con amor para abrirse en fechas especiales.
          Cada uno se desbloquea solo cuando llega su día, y tú decides cuándo escucharlo.
        </p>
      </section>

      @if (items().length) {
        <ul>
          @for (it of items(); track it.msg.id) {
            <li>
              @if (it.state === 'open') {
                <a class="msg open" [routerLink]="['/memorial', id(), 'boveda', it.msg.id]">
                  <span class="lock"><mv-icon name="unlock" color="#D4A843" /></span>
                  <span class="info">
                    <span class="title">{{ it.msg.title }}</span><br />
                    <span class="sub">Disponible desde el {{ toDate(it.msg.deliverAt) | date: 'longDate' }}</span><br />
                    <span class="fmt">{{ formatLabel[it.msg.format] }}</span>
                  </span>
                  <mv-icon name="chevron-right" color="#A89070" />
                </a>
              } @else if (it.state === 'locked') {
                <button type="button" class="msg locked" (click)="lockedTap(it.msg)">
                  <span class="lock"><mv-icon name="lock" color="#A89070" /></span>
                  <span class="info">
                    <span class="title">{{ it.msg.title }}</span><br />
                    <span class="sub">Se abrirá el {{ toDate(it.msg.deliverAt) | date: 'longDate' }}</span><br />
                    <span class="chip left">{{ it.days === 1 ? 'Falta 1 día' : 'Faltan ' + it.days + ' días' }}</span>
                  </span>
                </button>
              } @else {
                <div class="msg other">
                  <span class="lock"><mv-icon name="lock" color="#A89070" /></span>
                  <span class="info">
                    <span class="title">{{ it.msg.title }}</span><br />
                    <span class="sub">Mensaje para {{ it.recipients }}</span>
                  </span>
                </div>
              }
            </li>
          }
        </ul>
      } @else {
        <mv-empty-state emoji="⏳" title="La bóveda está en calma" message="No hay mensajes programados para el futuro." />
      }
    </div>
  `,
})
export class Vault {
  private readonly store = inject(MemorialStore);
  private readonly family = inject(FamilyStore);
  private readonly ui = inject(Ui);
  private readonly date = new DatePipe(inject(LOCALE_ID));

  readonly id = input.required<string>();

  protected readonly toDate = toDate;
  protected readonly formatLabel = FORMAT_LABEL;
  protected readonly memorial = computed(() => this.family.memorial(this.id()));

  protected readonly items = computed(() =>
    this.store.vault(this.id()).map(msg => {
      const unlocked = this.store.isUnlocked(msg);
      const canOpen = this.store.canOpen(msg);
      // Un mensaje para otra persona se muestra discreto, esté o no desbloqueado.
      const state: VaultState = !canOpen ? 'other' : unlocked ? 'open' : 'locked';
      return {
        msg,
        state,
        days: daysUntil(msg.deliverAt),
        recipients: msg.toIds.map(id => this.family.nameOf(id).split(' ')[0]).join(', '),
      };
    }),
  );

  protected lockedTap(msg: TimeMessage): void {
    this.ui.toast(`Este mensaje se abrirá el ${this.date.transform(toDate(msg.deliverAt), 'longDate')}`);
  }
}
