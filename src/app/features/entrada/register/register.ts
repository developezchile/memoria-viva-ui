import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RELATIONS, Relation } from '../../../core/data/models';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { Icon } from '../../../shared/icon';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 5. Creación de perfil: foto, nombre, relación, correo y contraseña. */
@Component({
  selector: 'mv-register',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <div class="hero">
      <a class="back" routerLink="/bienvenida" aria-label="Volver"><mv-icon name="arrow-left" /></a>
      <p class="emotive step">Último paso</p>
      <h1>Crea tu perfil</h1>
      <p class="sub">Tu espacio dentro del jardín de la familia {{ session.familySurname() }}</p>
    </div>

    <form class="screen-body form" novalidate (submit)="$event.preventDefault(); submit()">
      <label class="photo">
        <input type="file" accept="image/*" class="sr-only" (change)="onPhoto($event)" />
        <span class="photo-circle" [style.background-image]="photoUrl() ? 'url(' + photoUrl() + ')' : null">
          @if (!photoUrl()) {
            <mv-icon name="camera" [size]="28" color="#A89070" />
          }
        </span>
        <span class="photo-label">{{ photoUrl() ? 'Cambiar foto' : 'Agregar foto' }}</span>
      </label>

      <div>
        <label class="field-label" for="nombre">Nombre completo</label>
        <input id="nombre" class="input" type="text" autocomplete="name" placeholder="Carolina Acuña"
          [value]="name()" (input)="name.set($any($event.target).value)" />
        @if (tried() && errors().name) {
          <p class="error-text">{{ errors().name }}</p>
        }
      </div>

      <div>
        <label class="field-label" for="relacion">Relación con el ser querido</label>
        <select id="relacion" class="select" [class.empty]="!relation()" (change)="relation.set($any($event.target).value)">
          <option value="">Seleccionar relación</option>
          @for (r of relations; track r) {
            <option [value]="r" [selected]="r === relation()">{{ r }}</option>
          }
        </select>
        @if (tried() && errors().relation) {
          <p class="error-text">{{ errors().relation }}</p>
        }
      </div>

      <div>
        <label class="field-label" for="email">Correo electrónico</label>
        <input id="email" class="input" type="email" autocomplete="email" inputmode="email" placeholder="tu@correo.cl"
          [value]="email()" (input)="email.set($any($event.target).value)" />
        @if (tried() && errors().email) {
          <p class="error-text">{{ errors().email }}</p>
        }
      </div>

      <div>
        <label class="field-label" for="password">Contraseña</label>
        <div class="pass">
          <input id="password" class="input" [type]="showPass() ? 'text' : 'password'" autocomplete="new-password"
            placeholder="Mínimo 8 caracteres" [value]="password()" (input)="password.set($any($event.target).value)" />
          <button type="button" class="icon-btn" [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            (click)="showPass.set(!showPass())">
            <mv-icon name="eye" [size]="20" [color]="showPass() ? '#737B4C' : '#A89070'" />
          </button>
        </div>
        @if (tried() && errors().password) {
          <p class="error-text">{{ errors().password }}</p>
        }
      </div>

      @if (serverError()) {
        <p class="error-text" role="alert">{{ serverError() }}</p>
      }

      <button type="submit" class="btn-primary submit">Registrarse</button>
      <p class="note">Al registrarte aceptas compartir tus publicaciones solo con tu familia.</p>
    </form>
  `,
  styles: `
    .hero {
      position: relative; flex-shrink: 0; padding: 48px 24px 24px; background: var(--crema);
      border-bottom-left-radius: 32px; border-bottom-right-radius: 32px;
    }
    .back { display: inline-flex; margin: -8px 0 8px -8px; padding: 8px; border-radius: 50%; }
    .step { font-size: 1.25rem; }
    h1 { font-family: var(--font-titulo); font-size: 1.625rem; font-weight: 700; }
    .sub { margin-top: 4px; font-size: 0.8125rem; color: var(--texto-sec); }
    .form { display: flex; flex-direction: column; gap: 16px; padding: 24px 24px 32px; }
    .photo { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
    .photo-circle {
      display: flex; align-items: center; justify-content: center;
      width: 88px; height: 88px; border-radius: 50%;
      background: var(--crema) center / cover no-repeat; border: 3px dashed var(--borde);
    }
    .photo:focus-within .photo-circle { border-color: var(--verde); }
    .photo-label { font-size: 0.8125rem; color: var(--texto-sec); }
    .select.empty { color: var(--texto-sec); }
    .pass { position: relative; }
    .pass .input { padding-right: 52px; }
    .pass .icon-btn { position: absolute; right: 4px; top: 4px; }
    .submit { margin-top: 8px; }
    .note { font-size: 0.75rem; color: var(--texto-sec); text-align: center; line-height: 1.4; }
  `,
})
export class Register implements OnInit {
  protected readonly session = inject(Session);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly relations = RELATIONS;
  protected readonly name = signal('');
  protected readonly relation = signal<Relation | ''>('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPass = signal(false);
  protected readonly photo = signal<File | null>(null);
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly tried = signal(false);
  protected readonly serverError = signal('');

  protected readonly errors = computed(() => ({
    name: this.name().trim().length < 3 ? 'Escribe tu nombre completo.' : '',
    relation: !this.relation() ? 'Elige tu relación con el ser querido.' : '',
    email: !EMAIL_RE.test(this.email().trim())
      ? 'Ingresa un correo válido.'
      : this.session.emailTaken(this.email())
        ? 'Ya existe una cuenta con ese correo.'
        : '',
    password: this.password().length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : '',
  }));

  ngOnInit(): void {
    if (!this.session.gardenCode()) this.router.navigateByUrl('/escanear');
    this.destroyRef.onDestroy(() => this.revoke());
  }

  protected onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.revoke();
    this.photo.set(file);
    this.photoUrl.set(URL.createObjectURL(file));
  }

  protected async submit(): Promise<void> {
    this.tried.set(true);
    this.serverError.set('');
    if (Object.values(this.errors()).some(Boolean)) return;
    try {
      await this.ui.withLoading('Creando tu perfil…', () =>
        this.session.register({
          name: this.name(),
          relation: this.relation() as Relation,
          email: this.email(),
          password: this.password(),
          photo: this.photo() ?? undefined,
        }),
      );
      this.ui.toast(`Te damos la bienvenida, ${this.name().trim().split(' ')[0]}`);
      this.router.navigateByUrl('/familia');
    } catch (err) {
      this.serverError.set(err instanceof Error ? err.message : 'No pudimos crear tu cuenta.');
    }
  }

  private revoke(): void {
    const url = this.photoUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
