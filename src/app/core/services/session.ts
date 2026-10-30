import { Injectable, computed, inject, signal } from '@angular/core';

import { Member, Relation, User } from '../data/models';
import { SEED_FAMILY, VALID_GARDEN_CODES, seedUsers } from '../data/seed';
import { nowIso, persisted, uid } from '../data/storage';
import { FamilyStore } from './family';
import { MediaStore } from './media';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  relation: Relation;
  photo?: Blob;
}

/**
 * Autenticación local. Las contraseñas se guardan como hash SHA-256.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly family = inject(FamilyStore);
  private readonly media = inject(MediaStore);

  private readonly users = persisted<User[]>('users', seedUsers);
  private readonly userId = persisted<string | null>('session', () => null);
  /** Ya vio el onboarding en este dispositivo. */
  readonly onboarded = persisted<boolean>('onboarded', () => false);
  /** Código de jardín validado (por QR o manual) antes de registrarse. */
  readonly gardenCode = signal<string | null>(null);

  readonly user = computed(() => this.users().find(u => u.id === this.userId()) ?? null);
  readonly isLoggedIn = computed(() => !!this.user());
  readonly me = computed<Member | null>(() => {
    const u = this.user();
    return u ? (this.family.member(u.memberId) ?? null) : null;
  });
  /** Id del miembro actual (cadena vacía si no hay sesión). */
  readonly meId = computed(() => this.me()?.id ?? '');

  validateGardenCode(code: string): boolean {
    const ok = VALID_GARDEN_CODES.includes(code.trim().toUpperCase());
    if (ok) this.gardenCode.set(code.trim().toUpperCase());
    return ok;
  }

  emailTaken(email: string): boolean {
    return this.users().some(u => u.email === email.trim().toLowerCase());
  }

  async register(data: RegisterData): Promise<void> {
    const email = data.email.trim().toLowerCase();
    if (this.emailTaken(email)) throw new Error('Ya existe una cuenta con ese correo.');
    const photoMediaId = data.photo ? await this.media.put(data.photo) : undefined;
    const userId = uid();
    const member = this.family.addMember({ name: data.name.trim(), relation: data.relation, userId, photoMediaId });
    const user: User = { id: userId, email, passwordHash: await hash(data.password), memberId: member.id, createdAt: nowIso() };
    this.users.update(list => [...list, user]);
    this.userId.set(user.id);
    this.onboarded.set(true);
  }

  async login(email: string, password: string): Promise<void> {
    const user = this.users().find(u => u.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== (await hash(password))) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    this.userId.set(user.id);
    this.onboarded.set(true);
  }

  async changePassword(current: string, next: string): Promise<void> {
    const user = this.user();
    if (!user || user.passwordHash !== (await hash(current))) throw new Error('La contraseña actual no es correcta.');
    const passwordHash = await hash(next);
    this.users.update(list => list.map(u => (u.id === user.id ? { ...u, passwordHash } : u)));
  }

  updateEmail(email: string): void {
    const user = this.user();
    if (!user) return;
    const clean = email.trim().toLowerCase();
    if (clean !== user.email && this.emailTaken(clean)) throw new Error('Ya existe una cuenta con ese correo.');
    this.users.update(list => list.map(u => (u.id === user.id ? { ...u, email: clean } : u)));
  }

  logout(): void {
    this.userId.set(null);
  }

  readonly familySurname = computed(() => this.family.family().surname || SEED_FAMILY.surname);
}

async function hash(password: string): Promise<string> {
  const data = new TextEncoder().encode('memoria-viva:' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
