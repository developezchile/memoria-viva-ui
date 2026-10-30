import { CalendarEvent } from '../../core/data/models';

export type EventKind = CalendarEvent['kind'];

/** Tipos de evento con su etiqueta en español y color de la insignia. */
export const EVENT_KINDS: { id: EventKind; label: string; emoji: string; color: string }[] = [
  { id: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂', color: 'var(--dorado)' },
  { id: 'aniversario', label: 'Aniversario', emoji: '🌳', color: 'var(--verde)' },
  { id: 'partida', label: 'Aniversario de partida', emoji: '🕯️', color: 'var(--casa)' },
  { id: 'encuentro', label: 'Encuentro familiar', emoji: '🤝', color: 'var(--terracota)' },
  { id: 'otro', label: 'Otro', emoji: '📌', color: 'var(--arcilla)' },
];

export const EVENT_KIND = Object.fromEntries(EVENT_KINDS.map(k => [k.id, k])) as Record<EventKind, (typeof EVENT_KINDS)[number]>;

/** Fecha y hora locales ("YYYY-MM-DD" + "HH:mm") a ISO. */
export function localIso(day: string, time = '12:00'): string {
  return new Date(`${day}T${time || '12:00'}`).toISOString();
}

/** Fecha completa legible, p. ej. "viernes, 30 de octubre de 2026". */
export const fullDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' });
