import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Specialist } from '../../core/data/models';

/** Foto del especialista con iniciales de respaldo si la imagen no carga (p. ej. sin conexión). */
@Component({
  selector: 'mv-specialist-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .ph {
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      border-radius: 50%; background: var(--crema); border: 2px solid var(--borde);
      font-family: var(--font-titulo); font-weight: 600; color: var(--casa);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
  template: `
    <div class="ph" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.34">
      @if (!failed()) {
        <img [src]="specialist().photoUrl" [alt]="'Foto de ' + specialist().name" loading="lazy" (error)="failed.set(true)" />
      } @else {
        <span role="img" [attr.aria-label]="'Foto de ' + specialist().name">{{ initials() }}</span>
      }
    </div>
  `,
})
export class SpecialistPhoto {
  readonly specialist = input.required<Specialist>();
  readonly size = input(64);

  protected readonly failed = signal(false);
  protected readonly initials = computed(() =>
    this.specialist()
      .name.replace(/^Ps\.\s*/, '')
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join(''),
  );
}
