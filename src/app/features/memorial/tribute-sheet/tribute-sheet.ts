import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';

import { Memorial, Tribute } from '../../../core/data/models';
import { MemorialStore } from '../../../core/services/memorials';
import { Ui } from '../../../core/services/ui';
import { Sheet } from '../../../shared/sheet';

export type TributeKind = Tribute['kind'];

export const TRIBUTE_KINDS: { kind: TributeKind; emoji: string; label: string; action: string }[] = [
  { kind: 'flor', emoji: '🌸', label: 'Flor', action: 'Dejar una flor' },
  { kind: 'vela', emoji: '🕯️', label: 'Vela', action: 'Encender una vela' },
  { kind: 'mensaje', emoji: '💌', label: 'Mensaje', action: 'Escribir mensaje' },
];

const MAX_TRIBUTE = 300;

/** Modal 38 · Dejar homenaje (flor, vela o mensaje). Se crea al abrirse, con el tipo preseleccionado. */
@Component({
  selector: 'mv-tribute-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .kinds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .kind {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      min-height: 72px; border-radius: 16px; border: 2px solid var(--borde); background: var(--blanco);
      font-family: var(--font-cuerpo); font-size: 0.8125rem; font-weight: 600; color: var(--madera); cursor: pointer;
    }
    .kind.on { border-color: var(--verde); background: rgba(115, 123, 76, 0.1); }
    .em { font-size: 1.5rem; }
    .count { margin-top: 4px; text-align: right; font-size: 0.75rem; color: var(--texto-sec); }
  `,
  template: `
    <mv-sheet [open]="true" [title]="'Homenaje para ' + memorial().name" (closed)="closed.emit()">
      <div class="kinds" role="radiogroup" aria-label="Tipo de homenaje">
        @for (k of kinds; track k.kind) {
          <button
            type="button"
            role="radio"
            class="kind"
            [class.on]="kind() === k.kind"
            [attr.aria-checked]="kind() === k.kind"
            (click)="kind.set(k.kind); error.set('')"
          >
            <span class="em" aria-hidden="true">{{ k.emoji }}</span>
            {{ k.label }}
          </button>
        }
      </div>
      <label class="field-label" for="tribute-text">
        {{ kind() === 'mensaje' ? 'Tu mensaje' : 'Unas palabras (opcional)' }}
      </label>
      <textarea
        id="tribute-text"
        class="textarea"
        [placeholder]="kind() === 'mensaje' ? 'Escríbele lo que guardas en el corazón…' : 'Por ejemplo: Te recuerdo cada día'"
        [attr.maxlength]="max"
        [attr.aria-invalid]="!!error()"
        [value]="text()"
        (input)="text.set($any($event.target).value); error.set('')"
      ></textarea>
      @if (error()) {
        <p class="error-text" role="alert">{{ error() }}</p>
      }
      <p class="count">{{ text().length }}/{{ max }}</p>
      <div sheet-actions>
        <button type="button" class="btn-primary" (click)="save()">
          {{ kind() === 'flor' ? 'Dejar flor' : kind() === 'vela' ? 'Encender vela' : 'Dejar mensaje' }}
        </button>
      </div>
    </mv-sheet>
  `,
})
export class TributeSheet implements OnInit {
  private readonly store = inject(MemorialStore);
  private readonly ui = inject(Ui);

  readonly memorial = input.required<Memorial>();
  readonly initialKind = input<TributeKind>('flor');
  readonly closed = output<void>();

  protected readonly kinds = TRIBUTE_KINDS;
  protected readonly max = MAX_TRIBUTE;
  protected readonly kind = signal<TributeKind>('flor');
  protected readonly text = signal('');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.kind.set(this.initialKind());
  }

  protected save(): void {
    const m = this.memorial();
    const kind = this.kind();
    const text = this.text().trim();
    if (kind === 'mensaje' && !text) {
      this.error.set('Escribe unas palabras para tu mensaje.');
      return;
    }
    this.store.addTribute(m.id, kind, text.slice(0, MAX_TRIBUTE));
    this.closed.emit();
    const msg: Record<TributeKind, string> = {
      flor: `Dejaste una flor para ${m.name} 🌸`,
      vela: `Encendiste una vela por ${m.name} 🕯️`,
      mensaje: `Tu mensaje quedó en el muro de ${m.name} 💌`,
    };
    this.ui.toast(msg[kind]);
  }
}
