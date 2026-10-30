import { Injectable, computed } from '@angular/core';

import { Family, Id, Member, Memorial } from '../data/models';
import { SEED_FAMILY, seedMembers, seedMemorials } from '../data/seed';
import { initialsOf, persisted, uid } from '../data/storage';

const AVATAR_COLORS = ['#EBDFC6', '#E8D5C4', '#D9E0C8', '#E3D9EE', '#D6E4EA', '#F0E1C8'];

/** Persona que puede aparecer como autor, etiqueta o destinatario. */
export type Person =
  | { type: 'member'; id: Id; name: string; initials: string; data: Member }
  | { type: 'memorial'; id: Id; name: string; initials: string; data: Memorial };

/** Familia, miembros vivos y seres queridos (memoriales). */
@Injectable({ providedIn: 'root' })
export class FamilyStore {
  readonly family = persisted<Family>('family', () => SEED_FAMILY);
  readonly members = persisted<Member[]>('members', seedMembers);
  readonly memorials = persisted<Memorial[]>('memorials', seedMemorials);

  readonly people = computed<Person[]>(() => [
    ...this.memorials().map(m => ({ type: 'memorial' as const, id: m.id, name: m.name, initials: m.initials, data: m })),
    ...this.members().map(m => ({ type: 'member' as const, id: m.id, name: m.name, initials: m.initials, data: m })),
  ]);

  private readonly byId = computed(() => new Map(this.people().map(p => [p.id, p])));

  person(id: Id): Person | undefined {
    return this.byId().get(id);
  }

  member(id: Id): Member | undefined {
    return this.members().find(m => m.id === id);
  }

  memorial(id: Id): Memorial | undefined {
    return this.memorials().find(m => m.id === id);
  }

  nameOf(id: Id | 'todos'): string {
    return id === 'todos' ? 'Toda la familia' : (this.person(id)?.name ?? 'Alguien');
  }

  addMember(data: Pick<Member, 'name' | 'relation'> & Partial<Member>): Member {
    const member: Member = {
      id: uid(),
      initials: initialsOf(data.name),
      avatarColor: AVATAR_COLORS[this.members().length % AVATAR_COLORS.length]!,
      ...data,
    };
    this.members.update(list => [...list, member]);
    return member;
  }

  updateMember(id: Id, patch: Partial<Member>): void {
    this.members.update(list =>
      list.map(m => (m.id === id ? { ...m, ...patch, initials: patch.name ? initialsOf(patch.name) : m.initials } : m)),
    );
  }

  updateMemorial(id: Id, patch: Partial<Memorial>): void {
    this.memorials.update(list => list.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }
}
