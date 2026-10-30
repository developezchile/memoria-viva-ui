import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DiaryEntry } from '../../../core/data/models';
import { GriefStore } from '../../../core/services/grief';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Fab } from '../../../shared/fab';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { Sheet } from '../../../shared/sheet';

/** Mi Diario de Vida: entradas privadas de texto (crear, leer, editar, borrar). */
@Component({
  selector: 'mv-diary',
  imports: [DatePipe, Header, Icon, Sheet, Fab, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .intro { padding: 16px 16px 8px; display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--texto-sec); }
    .list { display: flex; flex-direction: column; gap: 12px; padding: 8px 16px; }
    .entry { display: flex; flex-direction: column; gap: 4px; width: 100%; border-radius: 16px; }
    .entry h2 { font-family: var(--font-titulo); font-size: 1.0625rem; font-weight: 600; }
    .date { font-size: 0.75rem; color: var(--texto-sec); }
    .excerpt {
      font-size: 0.875rem; line-height: 1.5; color: var(--madera);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .field { margin-bottom: 16px; }
    .textarea.long { height: 220px; line-height: 1.5; }
    .read-date { margin-bottom: 12px; font-size: 0.8125rem; color: var(--texto-sec); }
    .read-text { white-space: pre-wrap; font-size: 0.9375rem; line-height: 1.6; }
    .row { display: flex; gap: 10px; }
    .danger { color: var(--terracota); border-color: var(--terracota); }
  `,
  template: `
    <mv-header title="Mi Diario de Vida" back="/perfil" />

    <div class="screen-body with-nav">
      <p class="intro"><mv-icon name="lock" [size]="16" color="#A89070" /> Solo tú puedes leer estas páginas.</p>
      @if (entries().length) {
        <div class="list">
          @for (d of entries(); track d.id) {
            <button type="button" class="btn-reset card entry" (click)="openEntry(d)">
              <h2>{{ d.title || 'Sin título' }}</h2>
              <span class="date">{{ d.createdAt | date: "EEEE d 'de' MMMM, y" }}</span>
              <p class="excerpt">{{ d.text }}</p>
            </button>
          }
        </div>
      } @else {
        <mv-empty-state
          emoji="📔"
          title="Tu diario está en blanco"
          message="Escribe lo que sientes, lo que recuerdas o lo que te gustaría decir. Nadie más lo verá."
        >
          <button type="button" class="btn-primary" (click)="startNew()">Escribir una entrada</button>
        </mv-empty-state>
      }
    </div>

    <mv-fab (pressed)="startNew()" />

    <mv-sheet [open]="mode() !== null" [title]="sheetTitle()" (closed)="close()">
      @if (mode() === 'read') {
        @let d = current();
        @if (d) {
          <p class="read-date">{{ d.createdAt | date: "EEEE d 'de' MMMM, y · HH:mm" }}</p>
          <p class="read-text">{{ d.text }}</p>
        }
      } @else {
        <div class="field">
          <label class="field-label" for="diary-title">Título</label>
          <input id="diary-title" class="input" maxlength="80" placeholder="Un título para hoy" [value]="title()" (input)="title.set($any($event.target).value)" />
        </div>
        <div class="field">
          <label class="field-label" for="diary-text">¿Qué quieres escribir?</label>
          <textarea id="diary-text" class="textarea long" placeholder="Hoy recordé…" [value]="text()" (input)="text.set($any($event.target).value)"></textarea>
          @if (tried() && !text().trim()) {
            <p class="error-text">Escribe al menos unas palabras.</p>
          }
        </div>
      }
      <div sheet-actions>
        @if (mode() === 'read') {
          <button type="button" class="btn-primary" (click)="mode.set('edit')"><mv-icon name="edit" [size]="18" color="#FFFFFF" /> Editar</button>
          <button type="button" class="btn-secondary danger" (click)="remove()"><mv-icon name="trash" [size]="18" color="#A0503E" /> Eliminar</button>
        } @else {
          <button type="button" class="btn-primary" (click)="save()">Guardar</button>
        }
      </div>
    </mv-sheet>
  `,
})
export class Diary {
  private readonly grief = inject(GriefStore);
  private readonly ui = inject(Ui);

  protected readonly entries = this.grief.diary;

  /** null = cerrado; read = lectura; edit = edición de una existente; new = nueva. */
  protected readonly mode = signal<'read' | 'edit' | 'new' | null>(null);
  private readonly currentId = signal<string | null>(null);
  protected readonly current = computed(() => this.entries().find(d => d.id === this.currentId()));
  protected readonly title = signal('');
  protected readonly text = signal('');
  protected readonly tried = signal(false);

  protected readonly sheetTitle = computed(() => {
    switch (this.mode()) {
      case 'new': return 'Nueva entrada';
      case 'edit': return 'Editar entrada';
      default: return this.current()?.title || 'Sin título';
    }
  });

  protected startNew(): void {
    this.currentId.set(null);
    this.title.set('');
    this.text.set('');
    this.tried.set(false);
    this.mode.set('new');
  }

  protected openEntry(d: DiaryEntry): void {
    this.currentId.set(d.id);
    this.title.set(d.title);
    this.text.set(d.text);
    this.tried.set(false);
    this.mode.set('read');
  }

  protected close(): void {
    this.mode.set(null);
  }

  protected save(): void {
    this.tried.set(true);
    if (!this.text().trim()) return;
    const id = this.currentId();
    if (this.mode() === 'edit' && id) {
      this.grief.updateDiary(id, this.title(), this.text());
      this.ui.toast('Entrada actualizada');
      this.mode.set('read');
    } else {
      this.grief.addDiary(this.title(), this.text());
      this.ui.toast('Guardado en tu diario');
      this.mode.set(null);
    }
  }

  protected async remove(): Promise<void> {
    const id = this.currentId();
    if (!id) return;
    const ok = await this.ui.confirm({
      title: '¿Eliminar esta entrada?',
      message: 'Esta página de tu diario se borrará para siempre.',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.grief.deleteDiary(id);
    this.mode.set(null);
    this.ui.toast('Entrada eliminada');
  }
}
