import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EMOTION_BY_ID } from '../../../core/data/catalog';
import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { GriefStore } from '../../../core/services/grief';
import { MemorialStore } from '../../../core/services/memorials';
import { Session } from '../../../core/services/session';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { MediaUrlPipe } from '../../../shared/media-url.pipe';
import { PersonAvatar } from '../../../shared/person-avatar';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';

type Tab = 'posts' | 'estados' | 'diario';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts', label: 'Mis posts' },
  { id: 'estados', label: 'Mis estados' },
  { id: 'diario', label: 'Mi diario' },
];

/** Mi Perfil: cabecera, estadísticas, pestañas, Mi Herencia y seres queridos. */
@Component({
  selector: 'mv-profile',
  imports: [RouterLink, AsyncPipe, DatePipe, Header, Icon, PersonAvatar, EmptyState, MediaUrlPipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly session = inject(Session);
  private readonly familyStore = inject(FamilyStore);
  private readonly feed = inject(FeedStore);
  private readonly grief = inject(GriefStore);
  private readonly memorialStore = inject(MemorialStore);

  protected readonly tabs = TABS;
  protected readonly emotions = EMOTION_BY_ID;
  protected readonly tab = signal<Tab>('posts');

  protected readonly me = this.session.me;
  protected readonly family = this.familyStore.family;
  protected readonly memorials = this.familyStore.memorials;

  protected readonly posts = computed(() => this.feed.postsBy(this.session.meId()));
  protected readonly logs = this.grief.logs;
  protected readonly diary = this.grief.diary;
  protected readonly heritageCount = computed(() => this.memorialStore.myHeritage().length);

  // Vistas previas: las tres más recientes de cada pestaña
  protected readonly postPreview = computed(() => this.posts().slice(0, 3));
  protected readonly logPreview = computed(() => this.logs().slice(0, 3));
  protected readonly diaryPreview = computed(() => this.diary().slice(0, 3));

  protected dots(n: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= n);
  }
}
