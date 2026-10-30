import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

import { Icon } from './icon';

/**
 * Modal tipo "bottom sheet" dentro del marco del teléfono.
 * Uso:
 *   <mv-sheet [open]="creating()" title="Nueva publicación" (closed)="creating.set(false)">
 *     …contenido…
 *     <div sheet-actions><button class="btn-primary">Publicar</button></div>
 *   </mv-sheet>
 * Debe ubicarse como hijo directo del host de la pantalla (que es `position: relative`).
 */
@Component({
  selector: 'mv-sheet',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .backdrop {
      position: absolute; inset: 0; z-index: 40;
      background: rgba(26, 18, 8, 0.45);
      display: flex; flex-direction: column; justify-content: flex-end;
      animation: fade 0.18s ease-out;
    }
    .backdrop.center { justify-content: center; padding: 24px; }
    .panel {
      display: flex; flex-direction: column;
      max-height: 92%;
      background: var(--fondo);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -8px 32px rgba(26, 18, 8, 0.2);
      animation: up 0.22s ease-out;
      outline: none;
    }
    .center .panel { border-radius: 20px; animation: pop 0.18s ease-out; }
    .grabber { width: 40px; height: 4px; margin: 10px auto 0; border-radius: 2px; background: var(--borde); }
    .center .grabber { display: none; }
    .head { display: flex; align-items: center; gap: 8px; padding: 12px 12px 8px 20px; }
    .head h2 { flex: 1; font-family: var(--font-titulo); font-size: 1.1875rem; font-weight: 600; }
    .close {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border: none; border-radius: 50%;
      background: rgba(74, 59, 42, 0.06); cursor: pointer;
    }
    .body { overflow-y: auto; padding: 4px 20px 16px; scrollbar-width: none; }
    .actions:not(:empty) { padding: 12px 20px 20px; border-top: 1px solid var(--borde); display: flex; flex-direction: column; gap: 10px; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes up { from { transform: translateY(40px); opacity: 0.6; } }
    @keyframes pop { from { transform: scale(0.95); opacity: 0; } }
  `,
  template: `
    @if (open()) {
      <div class="backdrop" [class.center]="center()" (click)="onBackdrop($event)">
        <div #panel class="panel" role="dialog" aria-modal="true" [attr.aria-label]="title()" tabindex="-1" (keydown.escape)="closed.emit()">
          <div class="grabber"></div>
          @if (title() || closable()) {
            <div class="head">
              <h2>{{ title() }}</h2>
              @if (closable()) {
                <button type="button" class="close" aria-label="Cerrar" (click)="closed.emit()">
                  <mv-icon name="x" [size]="18" />
                </button>
              }
            </div>
          }
          <div class="body"><ng-content /></div>
          <div class="actions"><ng-content select="[sheet-actions]" /></div>
        </div>
      </div>
    }
  `,
})
export class Sheet {
  readonly open = input(false);
  readonly title = input('');
  /** Centrado (diálogo) en vez de anclado abajo. */
  readonly center = input(false);
  readonly closable = input(true);
  readonly closed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => this.panel()?.nativeElement.focus());
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget && this.closable()) this.closed.emit();
  }
}
