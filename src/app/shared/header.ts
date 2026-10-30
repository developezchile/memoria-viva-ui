import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { Icon } from './icon';

/**
 * Cabecera de 56px. Con `back`, muestra la flecha que vuelve a la pantalla anterior
 * (o a la URL indicada si se entró directo). Contenido proyectado = acción derecha.
 * Uso: `<mv-header title="Galería" back="/familia"><button>…</button></mv-header>`
 */
@Component({
  selector: 'mv-header',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; flex-shrink: 0; position: relative; z-index: 2; }
    .header {
      height: 56px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px 0 16px;
      background: var(--crema);
      border-bottom: 1px solid var(--borde);
    }
    :host(.transparent) .header { background: transparent; border-bottom-color: transparent; }
    .back {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; margin-left: -10px;
      background: none; border: none; border-radius: 50%; cursor: pointer;
    }
    .back:hover { background: rgba(74, 59, 42, 0.06); }
    .title {
      flex: 1;
      min-width: 0;
      font-family: var(--font-titulo);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--madera);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .title.centered { text-align: center; }
    .right { display: flex; align-items: center; justify-content: flex-end; gap: 4px; min-width: 40px; }
  `,
  template: `
    <div class="header">
      @if (back()) {
        <button class="back" type="button" aria-label="Volver" (click)="goBack()">
          <mv-icon name="arrow-left" />
        </button>
      }
      <h1 class="title" [class.centered]="!!back()">{{ title() }}</h1>
      <div class="right"><ng-content /></div>
    </div>
  `,
})
export class Header {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly title = input('');
  /** URL de respaldo para volver si no hay historial dentro de la app. */
  readonly back = input<string | undefined>(undefined);

  protected goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) this.location.back();
    else this.router.navigateByUrl(this.back()!);
  }
}
