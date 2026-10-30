import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Interruptor on/off. Uso: `<mv-toggle [(on)]="notificaciones" label="Notificaciones" />` */
@Component({
  selector: 'mv-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .track {
      width: 48px; height: 28px; border-radius: 14px; position: relative;
      background: var(--borde); border: none; padding: 0; cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .track.on { background: var(--verde); }
    .thumb {
      width: 22px; height: 22px; border-radius: 50%; background: #fff;
      position: absolute; top: 3px; left: 3px;
      transition: left 0.2s ease; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
    .on .thumb { left: 23px; }
  `,
  template: `
    <button type="button" role="switch" class="track" [class.on]="on()" [attr.aria-checked]="on()" [attr.aria-label]="label() || null" (click)="on.set(!on())">
      <span class="thumb"></span>
    </button>
  `,
})
export class Toggle {
  readonly on = model(false);
  /** Nombre accesible cuando el interruptor no está dentro de un <label>. */
  readonly label = input('');
}
