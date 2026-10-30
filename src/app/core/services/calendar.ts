import { Injectable, computed, inject } from '@angular/core';

import { CalendarEvent, Id, Task } from '../data/models';
import { seedEvents, seedTasks } from '../data/seed';
import { persisted, uid } from '../data/storage';
import { Session } from './session';

/** Clave de día local "YYYY-MM-DD" para agrupar por fecha. */
export function dayKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Eventos familiares y tareas compartidas. */
@Injectable({ providedIn: 'root' })
export class CalendarStore {
  private readonly session = inject(Session);

  readonly events = persisted<CalendarEvent[]>('events', seedEvents);
  readonly tasks = persisted<Task[]>('tasks', seedTasks);

  readonly upcoming = computed(() => {
    const today = dayKey(new Date());
    return [...this.events()].filter(e => dayKey(e.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  });

  readonly sortedTasks = computed(() =>
    [...this.tasks()].sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date)),
  );

  event(id: Id): CalendarEvent | undefined {
    return this.events().find(e => e.id === id);
  }

  eventsOn(day: string): CalendarEvent[] {
    return this.events().filter(e => dayKey(e.date) === day);
  }

  tasksOn(day: string): Task[] {
    return this.tasks().filter(t => dayKey(t.date) === day);
  }

  addEvent(data: Omit<CalendarEvent, 'id' | 'createdBy'>): CalendarEvent {
    const ev: CalendarEvent = { ...data, id: uid(), createdBy: this.session.meId() };
    this.events.update(list => [...list, ev]);
    return ev;
  }

  updateEvent(id: Id, patch: Partial<CalendarEvent>): void {
    this.events.update(list => list.map(e => (e.id === id ? { ...e, ...patch } : e)));
  }

  deleteEvent(id: Id): void {
    this.events.update(list => list.filter(e => e.id !== id));
  }

  toggleRitual(eventId: Id, ritualId: Id): void {
    const ev = this.event(eventId);
    if (!ev) return;
    const ritualIds = ev.ritualIds.includes(ritualId) ? ev.ritualIds.filter(r => r !== ritualId) : [...ev.ritualIds, ritualId];
    this.updateEvent(eventId, { ritualIds });
  }

  addTask(data: Omit<Task, 'id' | 'createdBy' | 'done'>): Task {
    const task: Task = { ...data, id: uid(), done: false, createdBy: this.session.meId() };
    this.tasks.update(list => [...list, task]);
    return task;
  }

  toggleTask(id: Id): void {
    this.tasks.update(list => list.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  deleteTask(id: Id): void {
    this.tasks.update(list => list.filter(t => t.id !== id));
  }
}
