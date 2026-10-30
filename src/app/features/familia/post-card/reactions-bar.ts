import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Post, REACTIONS } from '../../../core/data/models';
import { FeedStore } from '../../../core/services/feed';
import { Session } from '../../../core/services/session';

/** Barra de reacciones (corazón, flor, vela). Tocar alterna la reacción del usuario actual. */
@Component({
  selector: 'mv-reactions-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      display: inline-flex; align-items: center; gap: 6px;
      min-height: 40px; padding: 0 14px; border-radius: 20px;
      background: var(--fondo); border: 1.5px solid transparent;
      font-family: var(--font-cuerpo); font-size: 0.875rem; color: var(--madera);
      cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    }
    button:active { transform: scale(0.95); }
    button.mine { background: rgba(115, 123, 76, 0.12); border-color: var(--verde); font-weight: 600; }
    .emoji { font-size: 1rem; line-height: 1; }
  `,
  template: `
    @for (r of counts(); track r.kind) {
      <button
        type="button"
        [class.mine]="r.mine"
        [attr.aria-pressed]="r.mine"
        [attr.aria-label]="r.label + ': ' + r.count + (r.mine ? ', tu reacción' : '')"
        (click)="feed.react(post().id, r.kind)"
      >
        <span class="emoji" aria-hidden="true">{{ r.emoji }}</span>
        <span aria-hidden="true">{{ r.count }}</span>
      </button>
    }
  `,
})
export class ReactionsBar {
  protected readonly feed = inject(FeedStore);
  private readonly session = inject(Session);

  readonly post = input.required<Post>();

  protected readonly counts = computed(() => {
    const reactions = this.post().reactions;
    const mine = reactions[this.session.meId()];
    const values = Object.values(reactions);
    return REACTIONS.map(r => ({ ...r, count: values.filter(k => k === r.kind).length, mine: mine === r.kind }));
  });
}
