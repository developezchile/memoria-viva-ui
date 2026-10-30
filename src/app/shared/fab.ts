import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Icon } from './icon';

/** Botón flotante "+" sobre la barra inferior. */
@Component({
  selector: 'mv-fab',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    button {
      position: absolute;
      bottom: calc(var(--nav-h) + 16px);
      right: 16px;
      z-index: 5;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--terracota);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(160, 80, 62, 0.3);
      transition: transform 0.15s ease;
    }
    button:hover { transform: scale(1.05); }
  `,
  template: `
    <button type="button" aria-label="Agregar" (click)="pressed.emit()">
      <mv-icon name="plus" color="#FFFFFF" />
    </button>
  `,
})
export class Fab {
  readonly pressed = output<void>();
}
