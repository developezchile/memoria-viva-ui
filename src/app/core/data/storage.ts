import { WritableSignal, effect, signal } from '@angular/core';

const PREFIX = 'mv:';

/**
 * Signal que se guarda en localStorage. Debe crearse en un contexto de inyección
 * (p. ej. como campo de un servicio).
 */
export function persisted<T>(key: string, initial: () => T): WritableSignal<T> {
  const s = signal<T>(read(key) ?? initial());
  effect(() => write(key, s()));
  return s;
}

function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Almacenamiento lleno o bloqueado: la app sigue funcionando en memoria.
  }
}

/** Borra todos los datos de la app (usado al reiniciar la demo). */
export function clearPersisted(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  } catch {
    /* sin acceso */
  }
}

export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');
}
