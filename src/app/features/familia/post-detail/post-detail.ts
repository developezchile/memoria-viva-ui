import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { MediaUrlPipe } from '../../../shared/media-url.pipe';
import { PersonAvatar } from '../../../shared/person-avatar';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';
import { ReactionsBar } from '../post-card/reactions-bar';
import { TagChips } from '../post-card/tag-chips';

const MAX_COMMENT = 500;

/** Detalle de publicación: foto/video ampliado, reacciones y comentarios. */
@Component({
  selector: 'mv-post-detail',
  imports: [AsyncPipe, RouterLink, EmptyState, Header, Icon, MediaUrlPipe, PersonAvatar, TimeAgoPipe, ReactionsBar, TagChips],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding-bottom: 16px; }
    .media { background: var(--madera); }
    .media img, .media video { display: block; width: 100%; max-height: 420px; object-fit: contain; }
    .author { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; }
    .name { font-size: 1rem; font-weight: 600; }
    .when { font-size: 0.75rem; color: var(--texto-sec); }
    .text { padding: 0 16px 12px; font-size: 1rem; line-height: 1.6; white-space: pre-line; }
    mv-tag-chips { padding: 0 16px 12px; }
    mv-reactions-bar { padding: 0 16px 16px; }
    .comments { padding: 16px; border-top: 1px solid var(--borde); }
    .comment { display: flex; gap: 10px; margin-bottom: 14px; }
    .bubble { flex: 1; min-width: 0; padding: 10px 14px; border-radius: 4px 16px 16px 16px; background: var(--blanco); box-shadow: var(--sombra-card); }
    .bubble .top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
    .bubble .who { font-size: 0.8125rem; font-weight: 600; }
    .bubble .ago { font-size: 0.6875rem; color: var(--texto-sec); white-space: nowrap; }
    .bubble p { font-size: 0.875rem; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; }
    .no-comments { font-size: 0.875rem; color: var(--texto-sec); }
    /* Campo de comentario fijo sobre la barra inferior */
    .composer {
      flex-shrink: 0; display: flex; align-items: center; gap: 8px;
      margin-bottom: var(--nav-h); padding: 8px 12px 8px 16px;
      background: var(--fondo); border-top: 1px solid var(--borde);
    }
    .composer .input { flex: 1; border-radius: 24px; }
    .send {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      width: 48px; height: 48px; border-radius: 50%; border: none; background: var(--terracota); cursor: pointer;
    }
    .send:disabled { background: var(--borde); cursor: not-allowed; }
  `,
  template: `
    @let p = post();
    <mv-header title="Publicación" back="/familia">
      @if (p && p.authorId === session.meId()) {
        <button type="button" class="icon-btn" aria-label="Eliminar publicación" (click)="remove()">
          <mv-icon name="trash" [size]="20" color="#A0503E" />
        </button>
      }
    </mv-header>

    @if (p) {
      <div class="screen-body">
        @if (p.mediaId) {
          <div class="media">
            @if (p.mediaType === 'video') {
              <video [src]="(p.mediaId | mediaUrl | async) ?? ''" controls playsinline preload="metadata"></video>
            } @else {
              <img [src]="(p.mediaId | mediaUrl | async) ?? ''" alt="Foto compartida por {{ family.nameOf(p.authorId) }}" />
            }
          </div>
        } @else if (p.imageUrl) {
          <div class="media"><img [src]="p.imageUrl" alt="Foto compartida por {{ family.nameOf(p.authorId) }}" /></div>
        }

        <div class="author">
          <mv-person-avatar [id]="p.authorId" [size]="44" />
          <div>
            <p class="name">{{ family.nameOf(p.authorId) }}</p>
            <p class="when">{{ p.createdAt | timeAgo }}</p>
          </div>
        </div>
        @if (p.text) {
          <p class="text">{{ p.text }}</p>
        }
        @if (p.taggedIds.length) {
          <mv-tag-chips [ids]="p.taggedIds" />
        }
        <mv-reactions-bar [post]="p" />

        <section class="comments" aria-labelledby="comments-title">
          <h2 id="comments-title" class="section-title">Comentarios ({{ p.comments.length }})</h2>
          @for (c of p.comments; track c.id) {
            <div class="comment">
              <mv-person-avatar [id]="c.authorId" [size]="32" />
              <div class="bubble">
                <div class="top">
                  <span class="who">{{ family.nameOf(c.authorId) }}</span>
                  <span class="ago">{{ c.createdAt | timeAgo }}</span>
                </div>
                <p>{{ c.text }}</p>
              </div>
            </div>
          } @empty {
            <p class="no-comments">Aún no hay comentarios. Deja unas palabras de cariño.</p>
          }
        </section>
      </div>

      <div class="composer">
        <label class="sr-only" for="comment-input">Escribe un comentario</label>
        <input
          id="comment-input"
          class="input"
          type="text"
          placeholder="Escribe un comentario…"
          autocomplete="off"
          [attr.maxlength]="maxComment"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="send()"
        />
        <button type="button" class="send" aria-label="Enviar comentario" [disabled]="!draft().trim()" (click)="send()">
          <mv-icon name="send" [size]="20" color="#FFFFFF" />
        </button>
      </div>
    } @else {
      <div class="screen-body with-nav">
        <mv-empty-state emoji="🍂" title="No encontramos esta publicación" message="Puede que haya sido eliminada o que el enlace no sea correcto.">
          <a class="btn-primary" routerLink="/familia" style="text-decoration: none">Volver al muro familiar</a>
        </mv-empty-state>
      </div>
    }
  `,
})
export class PostDetail {
  private readonly feed = inject(FeedStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  protected readonly family = inject(FamilyStore);
  protected readonly session = inject(Session);

  readonly id = input.required<string>();

  protected readonly maxComment = MAX_COMMENT;
  protected readonly post = computed(() => this.feed.post(this.id()));
  protected readonly draft = signal('');

  protected send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.feed.comment(this.id(), text.slice(0, MAX_COMMENT));
    this.draft.set('');
  }

  protected async remove(): Promise<void> {
    const ok = await this.ui.confirm({
      title: '¿Eliminar esta publicación?',
      message: 'Se borrará del muro familiar junto con sus comentarios. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.feed.delete(this.id());
    this.ui.toast('Publicación eliminada');
    await this.router.navigateByUrl('/familia');
  }
}
