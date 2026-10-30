import { Injectable, computed, inject } from '@angular/core';

import { EMOTION_BY_ID } from '../data/catalog';
import { DiaryEntry, EmotionId, EmotionLog, Id } from '../data/models';
import { seedDiary, seedEmotionLogs } from '../data/seed';
import { nowIso, persisted, uid } from '../data/storage';
import { Session } from './session';

/** Diario de vida, registro emocional y recursos leídos del usuario actual. */
@Injectable({ providedIn: 'root' })
export class GriefStore {
  private readonly session = inject(Session);

  private readonly allLogs = persisted<EmotionLog[]>('emotionLogs', seedEmotionLogs);
  private readonly allDiary = persisted<DiaryEntry[]>('diary', seedDiary);
  /** memberId → ids de recursos marcados como leídos */
  private readonly read = persisted<Record<Id, Id[]>>('resourcesRead', () => ({}));

  /** Registros del usuario actual, más recientes primero. */
  readonly logs = computed(() =>
    this.allLogs()
      .filter(l => l.memberId === this.session.meId())
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  );

  readonly diary = computed(() =>
    this.allDiary()
      .filter(d => d.memberId === this.session.meId())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  /** Último estado de ánimo de cada miembro (para el mural familiar). */
  readonly latestByMember = computed(() => {
    const map = new Map<Id, EmotionLog>();
    for (const l of this.allLogs()) {
      const cur = map.get(l.memberId);
      if (!cur || l.date > cur.date) map.set(l.memberId, l);
    }
    return map;
  });

  logEmotion(emotion: EmotionId, intensity: number, note: string, date: string): EmotionLog {
    const log: EmotionLog = { id: uid(), memberId: this.session.meId(), emotion, intensity, note: note.trim(), date, createdAt: nowIso() };
    this.allLogs.update(list => [...list, log]);
    return log;
  }

  deleteLog(id: Id): void {
    this.allLogs.update(list => list.filter(l => l.id !== id));
  }

  addDiary(title: string, text: string): DiaryEntry {
    const entry: DiaryEntry = { id: uid(), memberId: this.session.meId(), title: title.trim(), text: text.trim(), createdAt: nowIso() };
    this.allDiary.update(list => [entry, ...list]);
    return entry;
  }

  updateDiary(id: Id, title: string, text: string): void {
    this.allDiary.update(list => list.map(d => (d.id === id ? { ...d, title: title.trim(), text: text.trim() } : d)));
  }

  deleteDiary(id: Id): void {
    this.allDiary.update(list => list.filter(d => d.id !== id));
  }

  isRead(resourceId: Id): boolean {
    return (this.read()[this.session.meId()] ?? []).includes(resourceId);
  }

  toggleRead(resourceId: Id): void {
    const me = this.session.meId();
    this.read.update(map => {
      const list = map[me] ?? [];
      return { ...map, [me]: list.includes(resourceId) ? list.filter(r => r !== resourceId) : [...list, resourceId] };
    });
  }

  /**
   * Puntos para el gráfico de evolución: bienestar 1–5 por registro, en orden cronológico.
   * Emociones serenas suben con la intensidad; las difíciles bajan.
   */
  readonly chart = computed(() =>
    [...this.logs()].reverse().map(l => {
      const info = EMOTION_BY_ID[l.emotion];
      const shift = (l.intensity - 3) * 0.4;
      const value = info.valence >= 3 ? info.valence + shift : info.valence + 1 - shift;
      return { log: l, info, value: Math.max(1, Math.min(5, value)) };
    }),
  );
}
