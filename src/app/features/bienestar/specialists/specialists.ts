import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Specialist } from '../../../core/data/models';
import { WellnessStore } from '../../../core/services/wellness';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { SpecialistPhoto } from '../specialist-photo';

type FilterId = 'todos' | 'online' | 'presencial' | 'mascotas' | 'infantil';

const FILTERS: { id: FilterId; label: string; test: (s: Specialist) => boolean }[] = [
  { id: 'todos', label: 'Todos', test: () => true },
  { id: 'online', label: 'Online', test: s => s.modality.includes('Online') },
  { id: 'presencial', label: 'Presencial', test: s => s.modality.includes('Presencial') },
  { id: 'mascotas', label: 'Duelo por mascotas', test: s => s.petGrief },
  { id: 'infantil', label: 'Duelo infantil', test: s => s.specialties.includes('Duelo infantil') },
];

/** Minúsculas y sin tildes, para buscar "concepcion" o "Concepción" por igual. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Directorio de especialistas en duelo con búsqueda y filtros. */
@Component({
  selector: 'mv-specialists',
  imports: [RouterLink, Header, Icon, EmptyState, SpecialistPhoto],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .intro { font-size: 0.9375rem; line-height: 1.5; color: var(--casa); margin-bottom: 12px; }
    .search { position: relative; }
    .search mv-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); }
    .search .input { padding-left: 44px; padding-right: 44px; }
    .search .clear { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
    .filters { display: flex; gap: 8px; overflow-x: auto; margin: 12px -16px 0; padding: 0 16px 4px; scrollbar-width: none; }
    .filter {
      flex-shrink: 0; min-height: 40px; padding: 0 14px; border-radius: 20px; cursor: pointer;
      border: 1.5px solid var(--borde); background: #fff; color: var(--madera);
      font-family: var(--font-cuerpo); font-size: 0.8125rem;
    }
    .filter.on { background: var(--verde); border-color: var(--verde); color: #fff; font-weight: 600; }
    .count { margin: 16px 0 8px; font-size: 0.8125rem; color: var(--texto-sec); }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .spec { display: flex; gap: 14px; border-radius: 16px; text-decoration: none; color: inherit; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .name { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; color: var(--madera); }
    .title { font-size: 0.8125rem; color: var(--casa); }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
    .tag { background: var(--crema); color: var(--casa); }
    .tag.pet { background: rgba(212, 168, 67, 0.2); }
    .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-top: 4px; font-size: 0.75rem; color: var(--texto-sec); }
    .meta span { display: inline-flex; align-items: center; gap: 4px; }
    .rating { color: var(--madera); font-weight: 600; }
    .note { margin-top: 20px; font-size: 0.8125rem; line-height: 1.5; color: var(--texto-sec); text-align: center; }
  `,
  template: `
    <mv-header title="Especialistas" back="/bienestar" />
    <div class="screen-body with-nav">
      <p class="intro">Profesionales que acompañan el duelo con respeto, también el de nuestros animales.</p>

      <div class="search">
        <mv-icon name="search" [size]="18" color="#A89070" />
        <label for="spec-q" class="sr-only">Buscar por nombre, especialidad o ciudad</label>
        <input id="spec-q" class="input" type="search" placeholder="Nombre, especialidad o ciudad"
          [value]="query()" (input)="query.set($any($event.target).value)" />
        @if (query()) {
          <button type="button" class="icon-btn clear" aria-label="Borrar búsqueda" (click)="query.set('')">
            <mv-icon name="x" [size]="16" color="#A89070" />
          </button>
        }
      </div>

      <div class="filters" role="group" aria-label="Filtros">
        @for (f of filters; track f.id) {
          <button type="button" class="filter" [class.on]="filter() === f.id" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">
            {{ f.label }}
          </button>
        }
      </div>

      <p class="count" aria-live="polite">{{ results().length }} {{ results().length === 1 ? 'especialista' : 'especialistas' }}</p>

      @if (results().length) {
        <ul class="list" role="list">
          @for (s of results(); track s.id) {
            <li>
              <a class="card spec" [routerLink]="['/bienestar/especialistas', s.id]">
                <mv-specialist-photo [specialist]="s" [size]="64" />
                <span class="info">
                  <span class="name">{{ s.name }}</span>
                  <span class="title">{{ s.title }}</span>
                  <span class="tags">
                    @for (sp of s.specialties; track sp) {
                      <span class="chip tag" [class.pet]="sp === 'Duelo por mascotas'">{{ sp }}</span>
                    }
                  </span>
                  <span class="meta">
                    <span class="rating"><mv-icon name="star" [size]="13" color="#D4A843" [filled]="true" /> {{ s.rating.toFixed(1) }}</span>
                    <span>{{ s.modality.join(' · ') }}</span>
                    <span><mv-icon name="map-pin" [size]="13" color="#A89070" /> {{ s.city }}</span>
                  </span>
                </span>
              </a>
            </li>
          }
        </ul>
        <p class="note">El primer contacto es sin costo. Cada profesional te informará sus valores.</p>
      } @else {
        <mv-empty-state emoji="🔍" title="No encontramos especialistas con ese filtro" message="Prueba con otra búsqueda o revisa todos los profesionales disponibles.">
          <button type="button" class="btn-secondary" (click)="clear()">Limpiar filtros</button>
        </mv-empty-state>
      }
    </div>
  `,
})
export class Specialists {
  private readonly store = inject(WellnessStore);

  protected readonly filters = FILTERS;
  protected readonly query = signal('');
  protected readonly filter = signal<FilterId>('todos');

  protected readonly results = computed(() => {
    const q = norm(this.query().trim());
    const f = FILTERS.find(x => x.id === this.filter())!;
    return this.store.specialists.filter(
      s => f.test(s) && (!q || norm([s.name, s.title, s.city, ...s.specialties].join(' ')).includes(q)),
    );
  });

  protected clear(): void {
    this.query.set('');
    this.filter.set('todos');
  }
}
