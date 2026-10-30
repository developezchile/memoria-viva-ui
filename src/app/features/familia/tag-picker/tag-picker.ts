import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';

import { Id } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { Session } from '../../../core/services/session';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';
import { Sheet } from '../../../shared/sheet';

/** Sin tildes y en minúsculas, para buscar "maria" y encontrar "María". */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Modal 36 · Etiquetar familiares. Buscador con casillas de seres queridos y miembros.
 * Se crea al abrirse (con @if en el padre) y trabaja sobre un borrador hasta "Confirmar".
 */
@Component({
  selector: 'mv-tag-picker',
  imports: [Icon, PersonAvatar, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .search { position: relative; margin-bottom: 12px; }
    .search mv-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); }
    .search .input { padding-left: 42px; }
    .group { margin: 12px 0 6px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--texto-sec); }
    ul { list-style: none; margin: 0; padding: 0; background: var(--blanco); border-radius: 16px; overflow: hidden; box-shadow: var(--sombra-card); }
    label.row {
      display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 16px;
      border-bottom: 1px solid var(--fondo); cursor: pointer;
    }
    li:last-child label.row { border-bottom: none; }
    .info { flex: 1; min-width: 0; }
    .name { font-size: 0.9375rem; color: var(--madera); }
    .sub { font-size: 0.75rem; color: var(--texto-sec); }
    .badge { color: var(--casa); font-weight: 600; }
    input[type='checkbox'] { width: 22px; height: 22px; accent-color: var(--verde); flex-shrink: 0; cursor: pointer; }
    .none { padding: 24px 8px; text-align: center; font-size: 0.875rem; color: var(--texto-sec); }
  `,
  template: `
    <mv-sheet [open]="true" title="Etiquetar familiares" (closed)="closed.emit()">
      <div class="search">
        <mv-icon name="search" [size]="18" color="#A89070" />
        <label class="sr-only" for="tag-search">Buscar familiar</label>
        <input
          id="tag-search"
          class="input"
          type="search"
          placeholder="Buscar por nombre"
          autocomplete="off"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </div>

      @if (memorials().length) {
        <p class="group">Seres queridos</p>
        <ul>
          @for (m of memorials(); track m.id) {
            <li>
              <label class="row">
                <mv-person-avatar [id]="m.id" [size]="40" />
                <span class="info">
                  <span class="name">{{ m.name }}</span><br />
                  <span class="sub badge">Ser querido · {{ m.kind === 'mascota' ? 'Mascota' : m.epitaph }}</span>
                </span>
                <input type="checkbox" [checked]="isOn(m.id)" (change)="toggle(m.id)" />
              </label>
            </li>
          }
        </ul>
      }

      @if (members().length) {
        <p class="group">Familia</p>
        <ul>
          @for (m of members(); track m.id) {
            <li>
              <label class="row">
                <mv-person-avatar [id]="m.id" [size]="40" />
                <span class="info">
                  <span class="name">{{ m.name }}</span><br />
                  <span class="sub">{{ m.relation }}</span>
                </span>
                <input type="checkbox" [checked]="isOn(m.id)" (change)="toggle(m.id)" />
              </label>
            </li>
          }
        </ul>
      }

      @if (!memorials().length && !members().length) {
        <p class="none">No encontramos a nadie con "{{ query() }}".</p>
      }

      <div sheet-actions>
        <button type="button" class="btn-primary" (click)="confirmed.emit(draft())">
          Confirmar{{ draft().length ? ' (' + draft().length + ')' : '' }}
        </button>
      </div>
    </mv-sheet>
  `,
})
export class TagPicker implements OnInit {
  private readonly family = inject(FamilyStore);
  private readonly session = inject(Session);

  readonly selected = input<Id[]>([]);
  readonly confirmed = output<Id[]>();
  readonly closed = output<void>();

  protected readonly query = signal('');
  protected readonly draft = signal<Id[]>([]);

  private readonly matches = (name: string) => norm(name).includes(norm(this.query()));

  protected readonly memorials = computed(() =>
    this.family.memorials().filter(m => this.matches(m.name)),
  );
  protected readonly members = computed(() =>
    this.family.members().filter(m => m.id !== this.session.meId() && this.matches(m.name)),
  );

  ngOnInit(): void {
    this.draft.set([...this.selected()]);
  }

  protected isOn(id: Id): boolean {
    return this.draft().includes(id);
  }

  protected toggle(id: Id): void {
    this.draft.update(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));
  }
}
