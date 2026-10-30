import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { RELATIONS, Relation } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { MediaStore } from '../../../core/services/media';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Editar datos: foto, nombre, relación y correo. */
@Component({
  selector: 'mv-edit-profile',
  imports: [Header, Icon, PersonAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    .photo { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0; }
    .photo-wrap { position: relative; }
    .preview { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 2px solid var(--borde); }
    .cam {
      position: absolute; right: -2px; bottom: -2px;
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--terracota); border: 2px solid var(--fondo); cursor: pointer;
    }
    .change { font-size: 0.875rem; font-weight: 600; color: var(--terracota); cursor: pointer; }
    .hint { margin-top: 6px; font-size: 0.75rem; color: var(--texto-sec); }
  `,
  template: `
    <mv-header title="Editar datos" back="/perfil/configuracion" />

    <div class="screen-body with-nav">
      @let m = me();
      @if (m) {
        <form class="content" (submit)="$event.preventDefault(); save()" novalidate>
          <div class="photo">
            <div class="photo-wrap">
              @if (photoPreview(); as src) {
                <img class="preview" [src]="src" alt="Nueva foto de perfil" />
              } @else {
                <mv-person-avatar [id]="m.id" [size]="96" />
              }
              <label class="cam" for="photo-input" aria-label="Cambiar foto">
                <mv-icon name="camera" [size]="18" color="#FFFFFF" />
              </label>
            </div>
            <label class="change" for="photo-input">Cambiar foto</label>
            <input id="photo-input" type="file" accept="image/*" class="sr-only" (change)="onPhoto($event)" />
          </div>

          <div>
            <label class="field-label" for="ep-name">Nombre</label>
            <input id="ep-name" class="input" autocomplete="name" maxlength="60" [value]="name()" (input)="name.set($any($event.target).value)" />
            @if (tried() && errors().name) {
              <p class="error-text">{{ errors().name }}</p>
            }
          </div>

          <div>
            <label class="field-label" for="ep-relation">Relación con el ser querido</label>
            <select id="ep-relation" class="select" (change)="relation.set($any($event.target).value)">
              @for (r of relations; track r) {
                <option [value]="r" [selected]="r === relation()">{{ r }}</option>
              }
            </select>
          </div>

          <div>
            <label class="field-label" for="ep-email">Correo electrónico</label>
            <input id="ep-email" class="input" type="email" autocomplete="email" [value]="email()" (input)="email.set($any($event.target).value); emailError.set('')" />
            @if (tried() && errors().email) {
              <p class="error-text">{{ errors().email }}</p>
            } @else if (emailError()) {
              <p class="error-text">{{ emailError() }}</p>
            } @else {
              <p class="hint">Lo usas para iniciar sesión.</p>
            }
          </div>

          <button type="submit" class="btn-primary">Guardar cambios</button>
        </form>
      }
    </div>
  `,
})
export class EditProfile {
  private readonly session = inject(Session);
  private readonly family = inject(FamilyStore);
  private readonly media = inject(MediaStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly relations = RELATIONS;
  protected readonly me = this.session.me;

  protected readonly name = signal(this.session.me()?.name ?? '');
  protected readonly relation = signal<Relation>(this.session.me()?.relation ?? 'Otro');
  protected readonly email = signal(this.session.user()?.email ?? '');
  protected readonly photo = signal<File | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly emailError = signal('');
  protected readonly tried = signal(false);

  protected readonly errors = computed(() => {
    const e: Partial<Record<'name' | 'email', string>> = {};
    if (this.name().trim().length < 2) e.name = 'Escribe tu nombre.';
    if (!EMAIL_RE.test(this.email().trim())) e.email = 'Escribe un correo válido.';
    return e;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      const url = this.photoPreview();
      if (url) URL.revokeObjectURL(url);
    });
  }

  protected onPhoto(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.ui.toast('Elige una imagen');
      return;
    }
    const prev = this.photoPreview();
    if (prev) URL.revokeObjectURL(prev);
    this.photo.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  protected async save(): Promise<void> {
    this.tried.set(true);
    const me = this.me();
    if (!me || Object.keys(this.errors()).length) return;

    // El correo se valida primero: si ya existe, no guardamos nada.
    try {
      this.session.updateEmail(this.email());
    } catch (err) {
      this.emailError.set(err instanceof Error ? err.message : 'No se pudo actualizar el correo.');
      return;
    }

    await this.ui.withLoading('Guardando…', async () => {
      const file = this.photo();
      const photoMediaId = file ? await this.media.put(file) : undefined;
      if (photoMediaId && me.photoMediaId) void this.media.delete(me.photoMediaId);
      this.family.updateMember(me.id, {
        name: this.name().trim(),
        relation: this.relation(),
        ...(photoMediaId ? { photoMediaId } : {}),
      });
    });
    this.ui.toast('Tus datos fueron actualizados');
    this.goBack();
  }

  private goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) this.location.back();
    else void this.router.navigateByUrl('/perfil/configuracion');
  }
}
