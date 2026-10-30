import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { Session } from '../../../core/services/session';
import { EmptyState } from '../../../shared/empty-state';
import { Fab } from '../../../shared/fab';
import { Header } from '../../../shared/header';
import { PersonAvatar } from '../../../shared/person-avatar';
import { CreatePost } from '../create-post/create-post';
import { PostCard } from '../post-card/post-card';

/** Mi Familia · Muro familiar (inicio de la app). */
@Component({
  selector: 'mv-feed',
  imports: [RouterLink, CreatePost, EmptyState, Fab, Header, PersonAvatar, PostCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .intro { padding: 16px 16px 4px; }
    .intro p { font-size: 0.875rem; color: var(--texto-sec); }
    .intro .emotive { font-size: 1.25rem; color: var(--casa); }
    .people {
      display: flex; gap: 12px; list-style: none; margin: 0; padding: 12px 16px 16px;
      overflow-x: auto; scrollbar-width: none;
    }
    .people::-webkit-scrollbar { display: none; }
    .people li { flex-shrink: 0; }
    .person {
      display: flex; flex-direction: column; align-items: center; gap: 4px; width: 64px;
      text-decoration: none; color: var(--madera);
    }
    .person span {
      max-width: 64px; font-size: 0.6875rem; text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .person.memorial span { color: var(--casa); font-weight: 600; }
    .posts { display: flex; flex-direction: column; gap: 16px; padding: 0 16px; }
  `,
  template: `
    <mv-header title="Mi Familia" />

    <div class="screen-body with-nav">
      <div class="intro">
        <p class="emotive">Familia {{ family.family().surname }}</p>
        <p>{{ family.family().garden }} · un espacio solo para ustedes</p>
      </div>

      <ul class="people" aria-label="Integrantes de la familia">
        @for (m of family.memorials(); track m.id) {
          <li>
            <a class="person memorial" [routerLink]="['/memorial', m.id]" [attr.aria-label]="'Perfil memorial de ' + m.name">
              <mv-person-avatar [id]="m.id" [size]="56" />
              <span>{{ m.name }}</span>
            </a>
          </li>
        }
        @for (m of family.members(); track m.id) {
          <li>
            @if (m.id === session.meId()) {
              <a class="person" routerLink="/perfil" aria-label="Mi perfil">
                <mv-person-avatar [id]="m.id" [size]="56" />
                <span>Tú</span>
              </a>
            } @else {
              <div class="person">
                <mv-person-avatar [id]="m.id" [size]="56" />
                <span>{{ m.name.split(' ')[0] }}</span>
              </div>
            }
          </li>
        }
      </ul>

      @if (feed.sorted().length) {
        <div class="posts">
          @for (post of feed.sorted(); track post.id) {
            <mv-post-card [post]="post" />
          }
        </div>
      } @else {
        <mv-empty-state
          emoji="🌱"
          title="Tu muro está esperando"
          message="Aún no hay publicaciones en tu familia. ¡Sé el primero en compartir un recuerdo!"
        >
          <button type="button" class="btn-primary" (click)="creating.set(true)">Compartir un recuerdo</button>
        </mv-empty-state>
      }
    </div>

    <mv-fab (pressed)="creating.set(true)" />

    @if (creating()) {
      <mv-create-post (closed)="creating.set(false)" />
    }
  `,
})
export class Feed {
  protected readonly feed = inject(FeedStore);
  protected readonly family = inject(FamilyStore);
  protected readonly session = inject(Session);

  /** Modal 35 abierto. */
  protected readonly creating = signal(false);
}
