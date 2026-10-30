import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Id } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';

/** Chips de personas etiquetadas. Los seres queridos llevan acento dorado y enlazan a su memorial. */
@Component({
  selector: 'mv-tag-chips',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: var(--crema); color: var(--madera); text-decoration: none; }
    .chip.golden { background: rgba(212, 168, 67, 0.16); border: 1px solid var(--dorado); }
  `,
  template: `
    @for (t of tags(); track t.id) {
      @if (t.memorial) {
        <a class="chip golden" [routerLink]="['/memorial', t.id]">🕊️ {{ t.name }}</a>
      } @else {
        <span class="chip">{{ t.name }}</span>
      }
    }
  `,
})
export class TagChips {
  private readonly family = inject(FamilyStore);
  readonly ids = input.required<Id[]>();

  protected readonly tags = computed(() =>
    this.ids().map(id => ({ id, name: this.family.nameOf(id), memorial: this.family.person(id)?.type === 'memorial' })),
  );
}
