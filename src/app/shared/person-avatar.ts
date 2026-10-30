import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Id } from '../core/data/models';
import { FamilyStore } from '../core/services/family';
import { Avatar } from './avatar';
import { MediaUrlPipe } from './media-url.pipe';

/**
 * Avatar de un miembro o ser querido a partir de su id.
 * Los seres queridos (memoriales) llevan marco dorado.
 */
@Component({
  selector: 'mv-person-avatar',
  imports: [Avatar, AsyncPipe, MediaUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: inline-flex; flex-shrink: 0; }`,
  template: `
    @let p = person();
    @if (p) {
      <mv-avatar
        [initials]="p.initials"
        [size]="size()"
        [golden]="p.type === 'memorial'"
        [bg]="p.type === 'member' ? p.data.avatarColor : '#F5ECD6'"
        [src]="(p.data.photoMediaId | mediaUrl | async) ?? photoUrl()"
      />
    } @else {
      <mv-avatar initials="?" [size]="size()" />
    }
  `,
})
export class PersonAvatar {
  private readonly family = inject(FamilyStore);
  readonly id = input.required<Id>();
  readonly size = input(40);

  protected readonly person = computed(() => this.family.person(this.id()));
  protected readonly photoUrl = computed(() => {
    const p = this.person();
    return p?.type === 'memorial' ? p.data.photoUrl : undefined;
  });
}
