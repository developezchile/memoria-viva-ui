import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Post } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { Icon } from '../../../shared/icon';
import { MediaUrlPipe } from '../../../shared/media-url.pipe';
import { PersonAvatar } from '../../../shared/person-avatar';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';
import { ReactionsBar } from './reactions-bar';
import { TagChips } from './tag-chips';

/** Tarjeta de publicación del muro familiar. Tocar el cuerpo abre el detalle. */
@Component({
  selector: 'mv-post-card',
  imports: [AsyncPipe, RouterLink, Icon, MediaUrlPipe, PersonAvatar, TimeAgoPipe, ReactionsBar, TagChips],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    article { background: var(--blanco); border-radius: 16px; box-shadow: var(--sombra-card); overflow: hidden; }
    .author { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; }
    .who { min-width: 0; }
    .name { font-size: 0.9375rem; font-weight: 600; color: var(--madera); }
    .when { font-size: 0.75rem; color: var(--texto-sec); }
    .body { display: block; width: 100%; text-decoration: none; color: inherit; }
    .text {
      padding: 0 16px 12px; font-size: 0.9375rem; line-height: 1.55; color: var(--madera);
      display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;
      white-space: pre-line;
    }
    .media { position: relative; background: var(--crema); }
    .media img, .media video { display: block; width: 100%; max-height: 320px; object-fit: cover; }
    .play {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    }
    .play span {
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%; background: rgba(74, 59, 42, 0.55);
    }
    mv-tag-chips { padding: 12px 16px 0; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 16px; }
    .comments {
      display: inline-flex; align-items: center; gap: 6px; min-height: 40px;
      font-size: 0.8125rem; color: var(--texto-sec); text-decoration: none;
    }
  `,
  template: `
    @let p = post();
    <article [attr.aria-label]="'Publicación de ' + family.nameOf(p.authorId)">
      <div class="author">
        <mv-person-avatar [id]="p.authorId" [size]="40" />
        <div class="who">
          <p class="name">{{ family.nameOf(p.authorId) }}</p>
          <p class="when">{{ p.createdAt | timeAgo }}</p>
        </div>
      </div>

      <a class="body" [routerLink]="['/familia/post', p.id]" [attr.aria-label]="'Ver publicación de ' + family.nameOf(p.authorId)">
        @if (p.text) {
          <p class="text">{{ p.text }}</p>
        }
        @if (p.mediaId) {
          <div class="media">
            @if (p.mediaType === 'video') {
              <video [src]="(p.mediaId | mediaUrl | async) ?? ''" muted playsinline preload="metadata"></video>
              <div class="play"><span><mv-icon name="play" color="#FFFFFF" /></span></div>
            } @else {
              <img [src]="(p.mediaId | mediaUrl | async) ?? ''" alt="Foto compartida por {{ family.nameOf(p.authorId) }}" />
            }
          </div>
        } @else if (p.imageUrl) {
          <div class="media">
            <img [src]="p.imageUrl" alt="Foto compartida por {{ family.nameOf(p.authorId) }}" loading="lazy" />
          </div>
        }
      </a>

      @if (p.taggedIds.length) {
        <mv-tag-chips [ids]="p.taggedIds" />
      }

      <div class="foot">
        <mv-reactions-bar [post]="p" />
        <a class="comments" [routerLink]="['/familia/post', p.id]" [attr.aria-label]="p.comments.length + ' comentarios'">
          <mv-icon name="message" [size]="18" color="#A89070" />
          {{ p.comments.length }}
        </a>
      </div>
    </article>
  `,
})
export class PostCard {
  protected readonly family = inject(FamilyStore);
  readonly post = input.required<Post>();
}
