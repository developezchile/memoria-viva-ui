import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FamilyStore } from '../../../core/services/family';
import { FeedStore } from '../../../core/services/feed';
import { MemorialStore } from '../../../core/services/memorials';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { MediaUrlPipe } from '../../../shared/media-url.pipe';
import { PersonAvatar } from '../../../shared/person-avatar';
import { Sheet } from '../../../shared/sheet';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';
import { elapsedText, toDate } from '../dates';
import { TRIBUTE_KINDS, TributeKind, TributeSheet } from '../tribute-sheet/tribute-sheet';

const EMOJI: Record<TributeKind, string> = { flor: '🌸', vela: '🕯️', mensaje: '💌' };

const isKind = (v: unknown): v is TributeKind => v === 'flor' || v === 'vela' || v === 'mensaje';

/** Perfil memorial: cabecera dorada, árbol, homenajes, recuerdos y acceso a la bóveda. */
@Component({
  selector: 'mv-memorial-profile',
  imports: [AsyncPipe, DatePipe, MediaUrlPipe, RouterLink, EmptyState, Header, Icon, PersonAvatar, Sheet, TimeAgoPipe, TributeSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  templateUrl: './memorial-profile.html',
  styleUrl: './memorial-profile.scss',
})
export class MemorialProfile {
  private readonly feed = inject(FeedStore);
  private readonly store = inject(MemorialStore);
  private readonly router = inject(Router);
  protected readonly family = inject(FamilyStore);

  readonly id = input.required<string>();
  /** ?homenaje=flor|vela|mensaje abre el modal 38 al cargar. */
  readonly homenaje = input<string>();

  protected readonly kinds = TRIBUTE_KINDS;
  protected readonly emoji = EMOJI;
  protected readonly toDate = toDate;

  protected readonly memorial = computed(() => this.family.memorial(this.id()));
  protected readonly tributes = computed(() => this.store.tributesFor(this.id()));
  protected readonly flowers = computed(() => this.tributes().filter(t => t.kind === 'flor').length);
  protected readonly candles = computed(() => this.tributes().filter(t => t.kind === 'vela').length);
  protected readonly memories = computed(() => this.feed.postsTagging(this.id()));
  protected readonly vaultCount = computed(() => this.store.vault(this.id()).length);
  protected readonly treeAge = computed(() => {
    const tree = this.memorial()?.tree;
    return tree ? elapsedText(tree.plantedAt) : '';
  });

  /** Muro: muestra 5 homenajes y permite ver todos. */
  protected readonly showAll = signal(false);
  protected readonly visibleTributes = computed(() => (this.showAll() ? this.tributes() : this.tributes().slice(0, 5)));

  /** Modal 38 abierto con el tipo preseleccionado (null = cerrado). */
  protected readonly tributeKind = signal<TributeKind | null>(null);
  /** Puente del Arcoíris (mascotas). */
  protected readonly rainbowOpen = signal(false);

  constructor() {
    // Abre el homenaje preseleccionado si llega por query (p. ej. desde un mensaje de la bóveda).
    effect(() => {
      const kind = this.homenaje();
      if (isKind(kind)) untracked(() => this.tributeKind.set(kind));
    });
  }

  protected openTribute(kind: TributeKind): void {
    this.tributeKind.set(kind);
  }

  protected closeTribute(): void {
    this.tributeKind.set(null);
    // Limpia el query para que no se vuelva a abrir al recargar.
    if (this.homenaje()) {
      void this.router.navigate([], { queryParams: { homenaje: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }
}
