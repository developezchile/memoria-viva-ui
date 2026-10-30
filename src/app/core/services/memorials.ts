import { Injectable, computed, inject } from '@angular/core';

import { Id, TimeMessage, Tribute } from '../data/models';
import { seedTimeMessages, seedTributes } from '../data/seed';
import { nowIso, persisted, uid } from '../data/storage';
import { MediaStore } from './media';
import { Session } from './session';

export interface NewTimeMessage {
  title: string;
  toIds: Id[];
  format: TimeMessage['format'];
  media?: Blob;
  text?: string;
  durationSec?: number;
  deliverAt: string;
}

/** Homenajes del muro memorial y mensajes de la bóveda del tiempo / Mi Herencia. */
@Injectable({ providedIn: 'root' })
export class MemorialStore {
  private readonly session = inject(Session);
  private readonly media = inject(MediaStore);

  readonly tributes = persisted<Tribute[]>('tributes', seedTributes);
  readonly messages = persisted<TimeMessage[]>('timeMessages', seedTimeMessages);

  tributesFor(memorialId: Id): Tribute[] {
    return this.tributes()
      .filter(t => t.memorialId === memorialId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addTribute(memorialId: Id, kind: Tribute['kind'], text: string): void {
    const tribute: Tribute = { id: uid(), memorialId, authorId: this.session.meId(), kind, text: text.trim(), createdAt: nowIso() };
    this.tributes.update(list => [tribute, ...list]);
  }

  /** Mensajes que dejó un ser querido, ordenados por fecha de entrega. */
  vault(memorialId: Id): TimeMessage[] {
    return this.messages()
      .filter(m => m.fromId === memorialId)
      .sort((a, b) => a.deliverAt.localeCompare(b.deliverAt));
  }

  /** Mensajes programados por el usuario actual (Mi Herencia). */
  readonly myHeritage = computed(() =>
    this.messages()
      .filter(m => m.fromId === this.session.meId())
      .sort((a, b) => a.deliverAt.localeCompare(b.deliverAt)),
  );

  message(id: Id): TimeMessage | undefined {
    return this.messages().find(m => m.id === id);
  }

  isUnlocked(m: TimeMessage): boolean {
    return new Date(m.deliverAt).getTime() <= Date.now();
  }

  /** El usuario actual puede verlo: es destinatario (o es para todos) o es su autor. */
  canOpen(m: TimeMessage): boolean {
    const me = this.session.meId();
    return m.fromId === me || m.toIds.length === 0 || m.toIds.includes(me);
  }

  async addMessage(data: NewTimeMessage): Promise<TimeMessage> {
    const mediaId = data.media ? await this.media.put(data.media) : undefined;
    const msg: TimeMessage = {
      id: uid(),
      fromId: this.session.meId(),
      toIds: data.toIds,
      title: data.title.trim(),
      format: data.format,
      mediaId,
      text: data.text?.trim(),
      durationSec: data.durationSec,
      deliverAt: data.deliverAt,
      createdAt: nowIso(),
    };
    this.messages.update(list => [...list, msg]);
    return msg;
  }

  deleteMessage(id: Id): void {
    const msg = this.message(id);
    if (msg?.mediaId) void this.media.delete(msg.mediaId);
    this.messages.update(list => list.filter(m => m.id !== id));
  }
}
