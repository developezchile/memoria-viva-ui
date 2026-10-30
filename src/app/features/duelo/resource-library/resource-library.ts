import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RESOURCES } from '../../../core/data/catalog';
import { Resource } from '../../../core/data/models';
import { GriefStore } from '../../../core/services/grief';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';

type Filter = 'todos' | 'articulo' | 'audio' | 'mascota';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'articulo', label: 'Artículos' },
  { id: 'audio', label: 'Audios' },
  { id: 'mascota', label: 'Mascotas' },
];

/** Normaliza para buscar sin tildes ni mayúsculas. */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Biblioteca de recursos: artículos y audios sobre el duelo. */
@Component({
  selector: 'mv-resource-library',
  imports: [Header, Icon, EmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    .intro { font-size: 1.375rem; }
    .search { position: relative; }
    .search mv-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; }
    .search .input { padding-left: 44px; padding-right: 44px; }
    .search .clear { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
    .filters { display: flex; gap: 8px; overflow-x: auto; margin: 0 -16px; padding: 0 16px; }
    .filter {
      flex-shrink: 0; min-height: 40px; padding: 0 16px; border-radius: 20px;
      border: 1.5px solid var(--borde); background: var(--blanco);
      font-size: 0.8125rem; font-weight: 600; color: var(--madera); cursor: pointer;
    }
    .filter[aria-pressed='true'] { background: var(--verde); border-color: var(--verde); color: var(--blanco); }
    .count { font-size: 0.75rem; color: var(--texto-sec); }

    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .res { display: flex; flex-direction: column; padding: 0; overflow: hidden; text-decoration: none; color: inherit; border-radius: 16px; }
    .media { position: relative; height: 132px; background: var(--crema); }
    .media img { width: 100%; height: 100%; object-fit: cover; }
    .icon {
      position: absolute; left: 12px; bottom: -18px;
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 12px; background: var(--blanco);
      font-size: 1.25rem; box-shadow: var(--sombra-card);
    }
    .read {
      position: absolute; right: 10px; top: 10px;
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 20px; background: var(--verde); color: var(--blanco);
      font-size: 0.6875rem; font-weight: 600;
    }
    .body { padding: 24px 16px 16px; }
    .meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .kind { background: var(--crema); color: var(--casa); }
    .kind.audio { background: rgba(115, 123, 76, 0.15); color: var(--verde); }
    .mins { font-size: 0.75rem; color: var(--texto-sec); }
    .res h3 { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; line-height: 1.25; }
    .res p { margin-top: 4px; font-size: 0.8125rem; line-height: 1.5; color: var(--texto-sec); }
  `,
  template: `
    <mv-header title="Biblioteca de recursos" back="/duelo" />

    <div class="screen-body with-nav">
      <div class="content">
        <p class="intro emotive">Palabras que acompañan</p>

        <div class="search" role="search">
          <label for="q" class="sr-only">Buscar recursos</label>
          <mv-icon name="search" [size]="18" color="#A89070" />
          <input id="q" class="input" type="search" placeholder="Buscar: culpa, niños, respiración…"
            [value]="query()" (input)="query.set($any($event.target).value)" autocomplete="off" />
          @if (query()) {
            <button type="button" class="icon-btn clear" aria-label="Borrar búsqueda" (click)="query.set('')">
              <mv-icon name="x" [size]="18" />
            </button>
          }
        </div>

        <div class="filters scroll-hide" role="group" aria-label="Filtrar por tipo">
          @for (f of filters; track f.id) {
            <button type="button" class="filter" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">{{ f.label }}</button>
          }
        </div>

        <p class="count" aria-live="polite">{{ results().length }} recurso{{ results().length === 1 ? '' : 's' }}</p>

        @if (results().length) {
          <ul class="list">
            @for (r of results(); track r.id) {
              @let isRead = grief.isRead(r.id);
              <li>
                <a class="card res" [routerLink]="['/duelo/recursos', r.id]">
                  <div class="media">
                    <img [src]="r.image" [alt]="'Imagen ilustrativa: ' + r.title" loading="lazy" />
                    <span class="icon" aria-hidden="true">{{ r.icon }}</span>
                    @if (isRead) {
                      <span class="read"><mv-icon name="check" [size]="12" color="#FFFFFF" /> Leído</span>
                    }
                  </div>
                  <div class="body">
                    <div class="meta">
                      <span class="chip kind" [class.audio]="r.kind === 'audio'">{{ r.kind === 'audio' ? 'Audio' : 'Artículo' }}</span>
                      <span class="mins">{{ r.minutes }} min</span>
                    </div>
                    <h3>{{ r.title }}</h3>
                    <p>{{ r.summary }}</p>
                  </div>
                </a>
              </li>
            }
          </ul>
        } @else {
          <mv-empty-state emoji="🔍" title="No encontramos recursos"
            message="Prueba con otra palabra o cambia el filtro. Seguimos sumando lecturas para acompañarte.">
            <button type="button" class="btn-secondary" (click)="reset()">Ver todos los recursos</button>
          </mv-empty-state>
        }
      </div>
    </div>
  `,
})
export class ResourceLibrary {
  protected readonly grief = inject(GriefStore);

  protected readonly filters = FILTERS;
  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('todos');

  protected readonly results = computed<Resource[]>(() => {
    const q = norm(this.query().trim());
    const f = this.filter();
    return RESOURCES.filter(r => {
      if (f === 'articulo' || f === 'audio') { if (r.kind !== f) return false; }
      else if (f === 'mascota' && !r.tags.includes('mascota')) return false;
      if (!q) return true;
      return norm(`${r.title} ${r.summary} ${r.body.join(' ')}`).includes(q);
    });
  });

  protected reset(): void {
    this.query.set('');
    this.filter.set('todos');
  }
}
