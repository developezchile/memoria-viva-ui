import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Id } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { Ui } from '../../../core/services/ui';
import { Icon } from '../../../shared/icon';
import { Sheet } from '../../../shared/sheet';
import { TagPicker } from '../tag-picker/tag-picker';

const MAX_TEXT = 1000;
const MAX_VIDEO_MB = 60;

/**
 * Modal 35 · Crear publicación (con el modal 37 de cámara/galería y el 36 de etiquetas).
 * Se crea al abrirse (con @if en el padre), así cada publicación empieza en blanco.
 */
@Component({
  selector: 'mv-create-post',
  imports: [Icon, Sheet, TagPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .textarea { height: 120px; font-size: 0.9375rem; line-height: 1.5; }
    .count { margin-top: 4px; text-align: right; font-size: 0.75rem; color: var(--texto-sec); }
    .tools { display: flex; gap: 8px; margin-top: 12px; }
    .tool {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      min-height: 48px; border-radius: 12px; border: 1.5px dashed var(--borde); background: var(--blanco);
      font-family: var(--font-cuerpo); font-size: 0.875rem; font-weight: 600; color: var(--madera); cursor: pointer;
    }
    .tool:hover { border-color: var(--arcilla); }
    .preview { position: relative; margin-top: 12px; border-radius: 16px; overflow: hidden; background: var(--crema); }
    .preview img, .preview video { display: block; width: 100%; max-height: 220px; object-fit: cover; }
    .remove {
      position: absolute; top: 8px; right: 8px;
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: rgba(74, 59, 42, 0.7); cursor: pointer;
    }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .tag {
      display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 0 6px 0 12px;
      border-radius: 16px; background: var(--crema); border: none;
      font-family: var(--font-cuerpo); font-size: 0.8125rem; color: var(--madera); cursor: pointer;
    }
    .tag.golden { background: rgba(212, 168, 67, 0.16); border: 1px solid var(--dorado); }
    .hint { margin-top: 12px; font-size: 0.75rem; color: var(--texto-sec); text-align: center; }
    .option {
      display: flex; align-items: center; gap: 16px; width: 100%; min-height: 64px; padding: 12px 16px;
      margin-bottom: 8px; border-radius: 16px; border: none; background: var(--blanco); box-shadow: var(--sombra-card);
      font-family: var(--font-cuerpo); font-size: 1rem; color: var(--madera); text-align: left; cursor: pointer;
    }
    .option .ic {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 50%; background: var(--crema);
    }
    .option small { display: block; font-size: 0.75rem; color: var(--texto-sec); }
  `,
  template: `
    <!-- Selectores de archivo ocultos: los abren los botones del modal 37 -->
    <input #camera type="file" accept="image/*" capture="environment" hidden (change)="onFile($event)" />
    <input #gallery type="file" accept="image/*,video/*" hidden (change)="onFile($event)" />

    <mv-sheet [open]="true" title="Nueva publicación" (closed)="closed.emit()">
      <label class="field-label" for="post-text">¿Qué recuerdo quieres compartir hoy?</label>
      <textarea
        id="post-text"
        class="textarea"
        placeholder="Escribe un recuerdo, una anécdota o lo que sientes…"
        [attr.maxlength]="maxText"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
      ></textarea>
      <p class="count" aria-live="polite">{{ text().length }}/{{ maxText }}</p>

      @if (preview(); as pv) {
        <div class="preview">
          @if (pv.video) {
            <video [src]="pv.url" controls playsinline></video>
          } @else {
            <img [src]="pv.url" alt="Vista previa de la foto elegida" />
          }
          <button type="button" class="remove" aria-label="Quitar archivo" (click)="setFile(null)">
            <mv-icon name="x" [size]="18" color="#FFFFFF" />
          </button>
        </div>
      }

      @if (tagged().length) {
        <div class="tags" aria-label="Personas etiquetadas">
          @for (t of taggedPeople(); track t.id) {
            <button type="button" class="tag" [class.golden]="t.memorial" [attr.aria-label]="'Quitar etiqueta de ' + t.name" (click)="untag(t.id)">
              {{ t.name }} <mv-icon name="x" [size]="14" />
            </button>
          }
        </div>
      }

      <div class="tools">
        <button type="button" class="tool" (click)="pickerOpen.set(true)">
          <mv-icon name="camera" [size]="20" color="#A0503E" /> {{ file() ? 'Cambiar' : 'Foto o video' }}
        </button>
        <button type="button" class="tool" (click)="tagOpen.set(true)">
          <mv-icon name="tag" [size]="20" color="#737B4C" /> Etiquetar
        </button>
      </div>
      <p class="hint">Solo tu familia verá esta publicación.</p>

      <div sheet-actions>
        <button type="button" class="btn-primary" [disabled]="!canPublish()" (click)="publish()">Publicar</button>
      </div>
    </mv-sheet>

    <!-- Modal 37 · Selector de cámara o galería -->
    <mv-sheet [open]="pickerOpen()" title="Agregar foto o video" (closed)="pickerOpen.set(false)">
      <button type="button" class="option" (click)="camera.click()">
        <span class="ic"><mv-icon name="camera" color="#A0503E" /></span>
        <span>Tomar foto<small>Usa la cámara de tu teléfono</small></span>
      </button>
      <button type="button" class="option" (click)="gallery.click()">
        <span class="ic"><mv-icon name="image" color="#737B4C" /></span>
        <span>Elegir de la galería<small>Fotos o videos (hasta {{ maxVideoMb }} MB)</small></span>
      </button>
    </mv-sheet>

    @if (tagOpen()) {
      <mv-tag-picker [selected]="tagged()" (confirmed)="onTags($event)" (closed)="tagOpen.set(false)" />
    }
  `,
})
export class CreatePost {
  private readonly feed = inject(FeedStore);
  private readonly family = inject(FamilyStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  readonly closed = output<void>();

  protected readonly maxText = MAX_TEXT;
  protected readonly maxVideoMb = MAX_VIDEO_MB;

  protected readonly text = signal('');
  protected readonly file = signal<File | null>(null);
  protected readonly preview = signal<{ url: string; video: boolean } | null>(null);
  protected readonly tagged = signal<Id[]>([]);
  protected readonly pickerOpen = signal(false);
  protected readonly tagOpen = signal(false);

  protected readonly canPublish = computed(() => !!this.text().trim() || !!this.file());
  protected readonly taggedPeople = computed(() =>
    this.tagged().map(id => ({ id, name: this.family.nameOf(id), memorial: this.family.person(id)?.type === 'memorial' })),
  );

  constructor() {
    // Libera la vista previa al cerrar el modal.
    inject(DestroyRef).onDestroy(() => this.revoke());
  }

  protected onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    input.value = '';
    this.pickerOpen.set(false);
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) {
      this.ui.toast('Solo puedes compartir fotos o videos.');
      return;
    }
    if (f.type.startsWith('video/') && f.size > MAX_VIDEO_MB * 1024 * 1024) {
      this.ui.toast(`El video es muy pesado (máximo ${MAX_VIDEO_MB} MB).`);
      return;
    }
    this.setFile(f);
  }

  protected setFile(f: File | null): void {
    this.revoke();
    this.file.set(f);
    this.preview.set(f ? { url: URL.createObjectURL(f), video: f.type.startsWith('video/') } : null);
  }

  protected onTags(ids: Id[]): void {
    this.tagged.set(ids);
    this.tagOpen.set(false);
  }

  protected untag(id: Id): void {
    this.tagged.update(list => list.filter(x => x !== id));
  }

  protected async publish(): Promise<void> {
    if (!this.canPublish()) return;
    try {
      const post = await this.ui.withLoading('Publicando…', () =>
        this.feed.create({ text: this.text(), media: this.file() ?? undefined, taggedIds: this.tagged() }),
      );
      this.closed.emit();
      await this.router.navigate(['/familia/publicado', post.id]);
    } catch {
      this.ui.toast('No pudimos guardar tu publicación. Inténtalo otra vez.');
    }
  }

  private revoke(): void {
    const pv = this.preview();
    if (pv) URL.revokeObjectURL(pv.url);
  }
}
