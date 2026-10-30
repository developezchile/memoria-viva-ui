import { Injectable, computed, inject } from '@angular/core';

import { SPECIALISTS } from '../data/catalog';
import { ContactRequest, Id, WellnessResult } from '../data/models';
import { nowIso, persisted, uid } from '../data/storage';
import { Session } from './session';

export type WellnessLevel = 'bajo' | 'moderado' | 'bueno';

export interface WellnessReading {
  level: WellnessLevel;
  title: string;
  message: string;
  color: string;
}

/** Test de bienestar, directorio de especialistas y solicitudes de contacto. */
@Injectable({ providedIn: 'root' })
export class WellnessStore {
  private readonly session = inject(Session);

  readonly specialists = SPECIALISTS;
  private readonly results = persisted<WellnessResult[]>('wellnessResults', () => []);
  readonly requests = persisted<ContactRequest[]>('contactRequests', () => []);

  readonly myResults = computed(() =>
    this.results()
      .filter(r => r.memberId === this.session.meId())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly latest = computed(() => this.myResults()[0]);

  specialist(id: Id) {
    return this.specialists.find(s => s.id === id);
  }

  /** Guarda el test. Puntaje 0–100 a partir de respuestas 1–5. */
  submit(answers: number[]): WellnessResult {
    const score = Math.round(((answers.reduce((a, b) => a + b, 0) - answers.length) / (answers.length * 4)) * 100);
    const result: WellnessResult = { id: uid(), memberId: this.session.meId(), answers, score, createdAt: nowIso() };
    this.results.update(list => [...list, result]);
    return result;
  }

  reading(score: number): WellnessReading {
    if (score < 40) {
      return {
        level: 'bajo', color: '#A0503E', title: 'Tu bienestar necesita cuidado',
        message: 'Estás atravesando un momento difícil y no tienes que hacerlo sola o solo. Te recomendamos conversar con un especialista en duelo y apoyarte en tu familia.',
      };
    }
    if (score < 70) {
      return {
        level: 'moderado', color: '#D4A843', title: 'Tu bienestar es moderado',
        message: 'Hay días buenos y otros más pesados. Te recomendamos mantener tu diario emocional, revisar los recursos de Mi Duelo y no dudar en pedir ayuda si lo necesitas.',
      };
    }
    return {
      level: 'bueno', color: '#737B4C', title: 'Tu bienestar es bueno',
      message: 'Estás encontrando formas de sostener tu duelo. Sigue cuidando tus rutinas y comparte lo que te ayuda con tu familia.',
    };
  }

  requestContact(specialistId: Id, slot: string, message: string): ContactRequest {
    const req: ContactRequest = { id: uid(), specialistId, memberId: this.session.meId(), slot, message: message.trim(), createdAt: nowIso() };
    this.requests.update(list => [...list, req]);
    return req;
  }
}
