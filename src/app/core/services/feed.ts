import { Injectable, computed, inject } from '@angular/core';

import { Id, Post, ReactionKind } from '../data/models';
import { seedPosts } from '../data/seed';
import { nowIso, persisted, uid } from '../data/storage';
import { MediaStore } from './media';
import { Session } from './session';

export interface NewPost {
  text: string;
  media?: Blob;
  taggedIds: Id[];
}

/** Muro familiar: publicaciones, reacciones y comentarios. */
@Injectable({ providedIn: 'root' })
export class FeedStore {
  private readonly session = inject(Session);
  private readonly media = inject(MediaStore);

  readonly posts = persisted<Post[]>('posts', seedPosts);
  /** Más recientes primero. */
  readonly sorted = computed(() => [...this.posts()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  post(id: Id): Post | undefined {
    return this.posts().find(p => p.id === id);
  }

  postsBy(memberId: Id): Post[] {
    return this.sorted().filter(p => p.authorId === memberId);
  }

  postsTagging(id: Id): Post[] {
    return this.sorted().filter(p => p.taggedIds.includes(id));
  }

  async create(data: NewPost): Promise<Post> {
    const mediaId = data.media ? await this.media.put(data.media) : undefined;
    const post: Post = {
      id: uid(),
      authorId: this.session.meId(),
      text: data.text.trim(),
      mediaId,
      mediaType: data.media ? (data.media.type.startsWith('video/') ? 'video' : 'image') : undefined,
      taggedIds: data.taggedIds,
      reactions: {},
      comments: [],
      createdAt: nowIso(),
    };
    this.posts.update(list => [post, ...list]);
    return post;
  }

  /** Alterna la reacción del usuario actual (misma reacción = quitarla). */
  react(postId: Id, kind: ReactionKind): void {
    const me = this.session.meId();
    this.patch(postId, p => {
      const reactions = { ...p.reactions };
      if (reactions[me] === kind) delete reactions[me];
      else reactions[me] = kind;
      return { ...p, reactions };
    });
  }

  comment(postId: Id, text: string): void {
    const comment = { id: uid(), authorId: this.session.meId(), text: text.trim(), createdAt: nowIso() };
    this.patch(postId, p => ({ ...p, comments: [...p.comments, comment] }));
  }

  delete(postId: Id): void {
    const post = this.post(postId);
    if (post?.mediaId) void this.media.delete(post.mediaId);
    this.posts.update(list => list.filter(p => p.id !== postId));
  }

  private patch(id: Id, fn: (p: Post) => Post): void {
    this.posts.update(list => list.map(p => (p.id === id ? fn(p) : p)));
  }
}
