import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TimeMessage } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { MemorialStore } from '../../../core/services/memorials';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Fab } from '../../../shared/fab';
import { Header } from '../../../shared/header';
import { Icon, IconName } from '../../../shared/icon';

const FORMAT_ICON: Record<TimeMessage['format'], IconName> = { audio: 'mic', video: 'video', texto: 'edit' };
const FORMAT_LABEL: Record<TimeMessage['format'], string> = { audio: 'Audio', video: 'Video', texto: 'Carta' };
const DAY = 86_400_000;

/** Mi Herencia: mensajes que el usuario dejó programados para el futuro. */
@Component({
  selector: 'mv-heritage-list',
  imports: [DatePipe, RouterLink, Header, Icon, Fab, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .intro { padding: 20px 16px 8px; text-align: center; }
    .intro .emotive { font-size: 1.375rem; line-height: 1.2; }
    .intro p { margin-top: 6px; font-size: 0.8125rem; line-height: 1.5; color: var(--texto-sec); }
    .list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .msg { display: flex; gap: 12px; border-radius: 16px; }
    .fmt {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 50%; background: var(--crema); flex-shrink: 0;
    }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .top { display: flex; align-items: flex-start; gap: 8px; }
    .top h2 { flex: 1; min-width: 0; font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; }
    .del { width: 36px; height: 36px; margin: -6px -6px 0 0; }
    .to { font-size: 0.8125rem; color: var(--madera); }
    .to span { color: var(--texto-sec); }
    .when { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--texto-sec); }
    .chip { align-self: flex-start; margin-top: 4px; background: rgba(212, 168, 67, 0.16); color: var(--casa); }
    .chip.ready { background: rgba(115, 123, 76, 0.16); color: var(--verde); }
  `,
  template: `
    <mv-header title="Mi Herencia" back="/perfil" />

    <div class="screen-body with-nav">
      @if (messages().length) {
        <div class="intro">
          <p class="emotive">Palabras que esperan su momento</p>
          <p>Tus mensajes se guardan con cuidado y se abrirán solo en la fecha que elegiste.</p>
        </div>
        <div class="list">
          @for (m of messages(); track m.id) {
            @let left = daysLeft(m);
            <article class="card msg">
              <span class="fmt" [attr.aria-label]="formatLabel[m.format]" role="img">
                <mv-icon [name]="formatIcon[m.format]" [size]="20" color="#A0503E" />
              </span>
              <div class="body">
                <div class="top">
                  <h2>{{ m.title }}</h2>
                  <button type="button" class="icon-btn del" [attr.aria-label]="'Eliminar ' + m.title" (click)="remove(m)">
                    <mv-icon name="trash" [size]="18" color="#A89070" />
                  </button>
                </div>
                <p class="to"><span>Para:</span> {{ recipients(m) }}</p>
                <p class="when">
                  <mv-icon [name]="left > 0 ? 'lock' : 'unlock'" [size]="14" color="#A89070" />
                  {{ m.deliverAt | date: "d 'de' MMMM, y · HH:mm" }}
                </p>
                <span class="chip" [class.ready]="left <= 0">
                  @if (left > 1) {
                    Faltan {{ left }} días
                  } @else if (left === 1) {
                    Falta 1 día
                  } @else {
                    Ya fue entregado
                  }
                </span>
              </div>
            </article>
          }
        </div>
      } @else {
        <mv-empty-state
          emoji="💌"
          title="No tienes mensajes programados para el futuro"
          message="Cuando lo sientas, puedes dejar una voz, una imagen o unas palabras para quienes amas. No hay apuro."
        >
          <a class="btn-primary" routerLink="/perfil/herencia/nueva">Crear un mensaje</a>
        </mv-empty-state>
      }
    </div>

    <mv-fab (pressed)="create()" />
  `,
})
export class HeritageList {
  private readonly memorials = inject(MemorialStore);
  private readonly family = inject(FamilyStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  protected readonly messages = this.memorials.myHeritage;
  protected readonly formatIcon = FORMAT_ICON;
  protected readonly formatLabel = FORMAT_LABEL;

  protected recipients(m: TimeMessage): string {
    return m.toIds.length ? m.toIds.map(id => this.family.nameOf(id)).join(', ') : 'Toda la familia';
  }

  /** Días que faltan para la entrega (redondeado hacia arriba; 0 o menos = ya entregado). */
  protected daysLeft(m: TimeMessage): number {
    return Math.ceil((new Date(m.deliverAt).getTime() - Date.now()) / DAY);
  }

  protected create(): void {
    void this.router.navigateByUrl('/perfil/herencia/nueva');
  }

  protected async remove(m: TimeMessage): Promise<void> {
    const ok = await this.ui.confirm({
      title: '¿Eliminar este mensaje?',
      message: `"${m.title}" ya no será entregado. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.memorials.deleteMessage(m.id);
    this.ui.toast('Mensaje eliminado');
  }
}
