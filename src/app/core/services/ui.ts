import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/** Estado global de interfaz: avisos, carga, confirmaciones y conexión. */
@Injectable({ providedIn: 'root' })
export class Ui {
  private readonly win = inject(DOCUMENT).defaultView;

  readonly toastMessage = signal<string | null>(null);
  readonly loading = signal<string | null>(null);
  readonly confirmState = signal<PendingConfirm | null>(null);
  readonly online = signal(this.win?.navigator.onLine ?? true);

  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.win?.addEventListener('online', () => this.online.set(true));
    this.win?.addEventListener('offline', () => this.online.set(false));
  }

  toast(message: string): void {
    clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2800);
  }

  /** Muestra el overlay de carga mientras corre la tarea. */
  async withLoading<T>(label: string, task: () => Promise<T>): Promise<T> {
    this.loading.set(label);
    try {
      return await task();
    } finally {
      this.loading.set(null);
    }
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => this.confirmState.set({ ...options, resolve }));
  }

  resolveConfirm(ok: boolean): void {
    this.confirmState()?.resolve(ok);
    this.confirmState.set(null);
  }
}
