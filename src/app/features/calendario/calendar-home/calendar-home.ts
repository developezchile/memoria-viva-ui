import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Id, Task } from '../../../core/data/models';
import { CalendarStore, dayKey } from '../../../core/services/calendar';
import { FamilyStore } from '../../../core/services/family';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { PersonAvatar } from '../../../shared/person-avatar';
import { Sheet } from '../../../shared/sheet';
import { EVENT_KIND, EVENT_KINDS, EventKind, fullDate, localIso } from '../event-kinds';

interface GridDay {
  key: string;
  date: Date;
  label: string;
  hasEvents: boolean;
  hasTasks: boolean;
}

/** Mi Calendario: vista mensual, agenda del día, próximos eventos y tareas familiares. */
@Component({
  selector: 'mv-calendar-home',
  imports: [DatePipe, NgTemplateOutlet, RouterLink, Header, Icon, Sheet, EmptyState, PersonAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  templateUrl: './calendar-home.html',
  styleUrl: './calendar-home.scss',
})
export class CalendarHome {
  protected readonly cal = inject(CalendarStore);
  protected readonly family = inject(FamilyStore);
  private readonly session = inject(Session);
  private readonly ui = inject(Ui);

  protected readonly weekdays = [
    { short: 'L', long: 'lunes' }, { short: 'M', long: 'martes' }, { short: 'M', long: 'miércoles' },
    { short: 'J', long: 'jueves' }, { short: 'V', long: 'viernes' }, { short: 'S', long: 'sábado' }, { short: 'D', long: 'domingo' },
  ];
  protected readonly kinds = EVENT_KINDS;
  protected readonly kindOf = EVENT_KIND;
  protected readonly todayKey = dayKey(new Date());

  /** Primer día del mes visible. */
  protected readonly month = signal(firstOfMonth(new Date()));
  protected readonly selected = signal(this.todayKey);

  private readonly eventDays = computed(() => new Set(this.cal.events().map(e => dayKey(e.date))));
  private readonly taskDays = computed(() => new Set(this.cal.tasks().map(t => dayKey(t.date))));

  /** Celdas del mes: `null` = hueco antes del día 1 (semana empieza el lunes). */
  protected readonly grid = computed<(GridDay | null)[]>(() => {
    const first = this.month();
    const lead = (first.getDay() + 6) % 7;
    const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (GridDay | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= total; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d);
      const key = dayKey(date);
      const hasEvents = this.eventDays().has(key);
      const hasTasks = this.taskDays().has(key);
      const extra = [hasEvents && 'con eventos', hasTasks && 'con tareas'].filter(Boolean).join(' y ');
      cells.push({ key, date, hasEvents, hasTasks, label: fullDate.format(date) + (extra ? `, ${extra}` : '') });
    }
    return cells;
  });

  protected readonly selectedDate = computed(() => new Date(`${this.selected()}T12:00`));
  protected readonly dayEvents = computed(() =>
    this.cal.eventsOn(this.selected()).sort((a, b) => a.date.localeCompare(b.date)),
  );
  protected readonly dayTasks = computed(() => this.cal.tasksOn(this.selected()).sort((a, b) => Number(a.done) - Number(b.done)));
  protected readonly upcoming = computed(() => this.cal.upcoming().slice(0, 4));
  protected readonly pendingTasks = computed(() => this.cal.sortedTasks().filter(t => !t.done));

  // --- Navegación del mes ---
  protected shiftMonth(delta: number): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  protected goToday(): void {
    this.month.set(firstOfMonth(new Date()));
    this.selected.set(this.todayKey);
  }

  // --- Tareas ---
  protected toggle(task: Task): void {
    this.cal.toggleTask(task.id);
    if (!task.done) this.ui.toast('Tarea completada 🌱');
  }

  protected async removeTask(task: Task): Promise<void> {
    const ok = await this.ui.confirm({
      title: '¿Eliminar esta tarea?',
      message: `"${task.title}" se quitará para toda la familia.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.cal.deleteTask(task.id);
    this.ui.toast('Tarea eliminada');
  }

  // --- Modal 39: nuevo evento ---
  protected readonly eventOpen = signal(false);
  protected readonly evTitle = signal('');
  protected readonly evDate = signal('');
  protected readonly evTime = signal('10:00');
  protected readonly evKind = signal<EventKind>('encuentro');
  protected readonly evDesc = signal('');
  protected readonly evParticipants = signal<Id[]>([]);
  protected readonly evMemorials = signal<Id[]>([]);
  protected readonly evTried = signal(false);
  protected readonly evTitleError = computed(() => (this.evTried() && !this.evTitle().trim() ? 'Escribe un nombre para el evento.' : ''));
  protected readonly evDateError = computed(() => (this.evTried() && !this.evDate() ? 'Elige una fecha.' : ''));

  protected openEvent(): void {
    this.evTitle.set('');
    this.evDate.set(this.selected());
    this.evTime.set('10:00');
    this.evKind.set('encuentro');
    this.evDesc.set('');
    this.evParticipants.set(this.session.meId() ? [this.session.meId()] : []);
    this.evMemorials.set([]);
    this.evTried.set(false);
    this.eventOpen.set(true);
  }

  protected toggleIn(list: WritableSignal<Id[]>, id: Id): void {
    list.update(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
  }

  protected saveEvent(): void {
    this.evTried.set(true);
    if (this.evTitleError() || this.evDateError()) return;
    const ev = this.cal.addEvent({
      title: this.evTitle().trim(),
      date: localIso(this.evDate(), this.evTime()),
      kind: this.evKind(),
      description: this.evDesc().trim(),
      participantIds: this.evParticipants(),
      memorialIds: this.evMemorials(),
      ritualIds: [],
    });
    this.eventOpen.set(false);
    this.focusDay(dayKey(ev.date));
    this.ui.toast('Evento creado 📅');
  }

  // --- Modal 40: nueva tarea ---
  protected readonly taskOpen = signal(false);
  protected readonly tkTitle = signal('');
  protected readonly tkAssignee = signal<Id | 'todos'>('todos');
  protected readonly tkDate = signal('');
  protected readonly tkTried = signal(false);
  protected readonly tkTitleError = computed(() => (this.tkTried() && !this.tkTitle().trim() ? 'Describe la tarea.' : ''));
  protected readonly tkDateError = computed(() => (this.tkTried() && !this.tkDate() ? 'Elige una fecha.' : ''));

  protected openTask(): void {
    this.tkTitle.set('');
    this.tkAssignee.set(this.session.meId() || 'todos');
    this.tkDate.set(this.selected());
    this.tkTried.set(false);
    this.taskOpen.set(true);
  }

  protected saveTask(): void {
    this.tkTried.set(true);
    if (this.tkTitleError() || this.tkDateError()) return;
    const task = this.cal.addTask({ title: this.tkTitle().trim(), assigneeId: this.tkAssignee(), date: localIso(this.tkDate()) });
    this.taskOpen.set(false);
    this.focusDay(dayKey(task.date));
    this.ui.toast(`Tarea asignada a ${this.family.nameOf(task.assigneeId)}`);
  }

  /** Muestra en el calendario el día de lo recién creado. */
  private focusDay(key: string): void {
    this.selected.set(key);
    this.month.set(firstOfMonth(new Date(`${key}T12:00`)));
  }
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
