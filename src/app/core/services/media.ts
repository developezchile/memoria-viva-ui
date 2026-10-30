import { Injectable } from '@angular/core';

import { uid } from '../data/storage';

const DB_NAME = 'memoria-viva';
const STORE = 'media';

/**
 * Archivos (fotos, audio, video) guardados en IndexedDB.
 * Las entidades guardan solo el `mediaId`; `url(id)` entrega un object URL para mostrarlo.
 */
@Injectable({ providedIn: 'root' })
export class MediaStore {
  private db?: Promise<IDBDatabase>;
  private readonly urls = new Map<string, Promise<string | undefined>>();

  /** Guarda un archivo. Las imágenes se reducen a máx. 1280 px para ahorrar espacio. */
  async put(file: Blob): Promise<string> {
    const blob = file.type.startsWith('image/') && file.type !== 'image/gif' ? await shrinkImage(file) : file;
    const id = uid();
    await this.tx('readwrite', s => s.put(blob, id));
    return id;
  }

  async get(id: string): Promise<Blob | undefined> {
    return this.tx<Blob | undefined>('readonly', s => s.get(id));
  }

  /** Object URL cacheado para un mediaId. */
  url(id: string): Promise<string | undefined> {
    let p = this.urls.get(id);
    if (!p) {
      p = this.get(id).then(b => (b ? URL.createObjectURL(b) : undefined));
      this.urls.set(id, p);
    }
    return p;
  }

  async delete(id: string): Promise<void> {
    await this.tx('readwrite', s => s.delete(id));
    const p = this.urls.get(id);
    this.urls.delete(id);
    p?.then(u => u && URL.revokeObjectURL(u));
  }

  async clear(): Promise<void> {
    await this.tx('readwrite', s => s.clear());
  }

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  }

  private async tx<T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const req = op(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }
}

async function shrinkImage(file: Blob, max = 1280): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 600_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>(res => canvas.toBlob(b => res(b ?? file), 'image/jpeg', 0.85));
  } catch {
    return file;
  }
}
