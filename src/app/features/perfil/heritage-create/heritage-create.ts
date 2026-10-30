import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Id, TimeMessage } from '../../../core/data/models';
import { FamilyStore } from '../../../core/services/family';
import { MemorialStore } from '../../../core/services/memorials';
import { Session } from '../../../core/services/session';
import { Ui } from '../../../core/services/ui';
import { Header } from '../../../shared/header';
import { Icon, IconName } from '../../../shared/icon';

type Format = TimeMessage['format'];
type RecState = 'idle' | 'recording' | 'recorded';

/** Duración máxima de una grabación: 15 minutos. */
const MAX_SEC = 15 * 60;

const FORMATS: { id: Format; label: string; icon: IconName }[] = [
  { id: 'audio', label: 'Audio', icon: 'mic' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'texto', label: 'Texto', icon: 'edit' },
];

const MIME_CANDIDATES: Record<'audio' | 'video', string[]> = {
  audio: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'],
  video: ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'],
};

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Mi Herencia · Crear mensaje: grabar audio/video o escribir, elegir destinatarios y fecha de entrega. */
@Component({
  selector: 'mv-heritage-create',
  imports: [Header, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  templateUrl: './heritage-create.html',
  styleUrl: './heritage-create.scss',
})
export class HeritageCreate {
  private readonly family = inject(FamilyStore);
  private readonly session = inject(Session);
  private readonly memorials = inject(MemorialStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  protected readonly formats = FORMATS;
  protected readonly maxLabel = '15:00';
  protected readonly today = localDate(new Date());

  // --- Formulario ---
  protected readonly format = signal<Format>('audio');
  protected readonly title = signal('');
  protected readonly text = signal('');
  /** Vacío = toda la familia. */
  protected readonly toIds = signal<Id[]>([]);
  protected readonly date = signal('');
  protected readonly time = signal('10:00');
  protected readonly tried = signal(false);

  protected readonly recipients = computed(() => this.family.members().filter(m => m.id !== this.session.meId()));

  // --- Grabación ---
  protected readonly recState = signal<RecState>('idle');
  protected readonly elapsed = signal(0);
  protected readonly blob = signal<Blob | null>(null);
  protected readonly blobUrl = signal<string | null>(null);
  protected readonly durationSec = signal<number | undefined>(undefined);
  /** Sin permiso o sin soporte: se ofrece subir un archivo. */
  protected readonly fallback = signal(false);
  protected readonly fallbackReason = signal('');
  protected readonly stream = signal<MediaStream | null>(null);

  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private startedAt = 0;

  private readonly live = viewChild<ElementRef<HTMLVideoElement>>('live');

  protected readonly timerLabel = computed(() => {
    const s = this.elapsed();
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  });
  protected readonly durationLabel = computed(() => {
    const s = this.durationSec();
    return s === undefined ? '' : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  });
  protected readonly progress = computed(() => Math.min(100, (this.elapsed() / MAX_SEC) * 100));

  // --- Validación ---
  protected readonly deliverAt = computed(() => {
    if (!this.date() || !this.time()) return null;
    const d = new Date(`${this.date()}T${this.time()}`);
    return isNaN(d.getTime()) ? null : d;
  });
  protected readonly errors = computed(() => {
    const e: Partial<Record<'title' | 'content' | 'date', string>> = {};
    if (!this.title().trim()) e.title = 'Dale un nombre a tu mensaje.';
    if (this.format() === 'texto') {
      if (!this.text().trim()) e.content = 'Escribe tu mensaje.';
    } else if (!this.blob()) {
      e.content = this.format() === 'audio' ? 'Graba o adjunta un audio.' : 'Graba o adjunta un video.';
    }
    const d = this.deliverAt();
    if (!d) e.date = 'Elige la fecha y hora de entrega.';
    else if (d.getTime() <= Date.now()) e.date = 'La fecha de entrega debe ser en el futuro.';
    return e;
  });
  protected readonly valid = computed(() => Object.keys(this.errors()).length === 0);

  constructor() {
    // Vista previa en vivo de la cámara mientras se graba video
    effect(() => {
      const el = this.live()?.nativeElement;
      if (el) el.srcObject = this.stream();
    });
    inject(DestroyRef).onDestroy(() => {
      this.stopTracks();
      clearInterval(this.timer);
      if (this.recorder?.state === 'recording') {
        this.recorder.onstop = null;
        this.recorder.stop();
      }
      this.revoke();
    });
  }

  protected selectFormat(f: Format): void {
    if (f === this.format()) return;
    if (this.recState() === 'recording') this.cancelRecording();
    this.discard();
    this.format.set(f);
    this.fallback.set(false);
  }

  // --- Destinatarios ---
  protected isAll(): boolean {
    return this.toIds().length === 0;
  }

  protected toggleRecipient(id: Id): void {
    this.toIds.update(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));
  }

  // --- Grabación con MediaRecorder ---
  protected async startRecording(): Promise<void> {
    const kind = this.format() as 'audio' | 'video';
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.useFallback('Tu navegador no permite grabar aquí. Puedes adjuntar un archivo.');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        kind === 'video' ? { video: { facingMode: 'user' }, audio: true } : { audio: true },
      );
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      this.useFallback(
        denied
          ? `No tenemos permiso para usar ${kind === 'video' ? 'la cámara' : 'el micrófono'}. Puedes adjuntar un archivo.`
          : `No encontramos ${kind === 'video' ? 'una cámara' : 'un micrófono'} disponible. Puedes adjuntar un archivo.`,
      );
      return;
    }

    const mimeType = MIME_CANDIDATES[kind].find(t => MediaRecorder.isTypeSupported(t));
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    this.discard();
    this.chunks = [];
    this.recorder = recorder;
    this.stream.set(stream);
    recorder.ondataavailable = e => e.data.size && this.chunks.push(e.data);
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm');
      this.setBlob(new Blob(this.chunks, { type }), this.elapsed());
      this.stopTracks();
    };
    recorder.start(1000);
    this.startedAt = Date.now();
    this.elapsed.set(0);
    this.recState.set('recording');
    this.timer = setInterval(() => {
      const s = Math.floor((Date.now() - this.startedAt) / 1000);
      this.elapsed.set(Math.min(s, MAX_SEC));
      if (s >= MAX_SEC) {
        this.stopRecording();
        this.ui.toast('Llegaste al máximo de 15 minutos. Tu grabación quedó guardada.');
      }
    }, 250);
  }

  protected stopRecording(): void {
    clearInterval(this.timer);
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }

  /** Detiene sin guardar (al cambiar de formato). */
  private cancelRecording(): void {
    clearInterval(this.timer);
    if (this.recorder) {
      this.recorder.onstop = null;
      if (this.recorder.state === 'recording') this.recorder.stop();
    }
    this.stopTracks();
  }

  protected rerecord(): void {
    this.discard();
    if (!this.fallback()) void this.startRecording();
  }

  protected onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const kind = this.format();
    if (!file.type.startsWith(kind === 'video' ? 'video/' : 'audio/')) {
      this.ui.toast(kind === 'video' ? 'Elige un archivo de video.' : 'Elige un archivo de audio.');
      input.value = '';
      return;
    }
    this.setBlob(file, undefined);
    input.value = '';
  }

  /** Duración real del archivo adjunto, cuando el navegador la conoce. */
  protected onMetadata(e: Event): void {
    const d = (e.target as HTMLMediaElement).duration;
    if (this.durationSec() === undefined && Number.isFinite(d)) {
      this.durationSec.set(Math.round(d));
      if (d > MAX_SEC) this.ui.toast('El archivo dura más de 15 minutos; considera acortarlo.');
    }
  }

  private useFallback(reason: string): void {
    this.fallback.set(true);
    this.fallbackReason.set(reason);
    this.ui.toast(reason);
  }

  private setBlob(b: Blob, seconds: number | undefined): void {
    this.revoke();
    this.blob.set(b);
    this.blobUrl.set(URL.createObjectURL(b));
    this.durationSec.set(seconds);
    this.recState.set('recorded');
  }

  private discard(): void {
    this.revoke();
    this.blob.set(null);
    this.durationSec.set(undefined);
    this.elapsed.set(0);
    this.recState.set('idle');
  }

  private revoke(): void {
    const url = this.blobUrl();
    if (url) URL.revokeObjectURL(url);
    this.blobUrl.set(null);
  }

  private stopTracks(): void {
    this.stream()?.getTracks().forEach(t => t.stop());
    this.stream.set(null);
  }

  // --- Guardar ---
  protected async save(): Promise<void> {
    this.tried.set(true);
    const deliverAt = this.deliverAt();
    if (!this.valid() || !deliverAt) {
      this.ui.toast('Revisa los campos marcados');
      return;
    }
    const isText = this.format() === 'texto';
    try {
      await this.ui.withLoading('Guardando tu mensaje…', () =>
        this.memorials.addMessage({
          title: this.title(),
          toIds: this.toIds(),
          format: this.format(),
          media: isText ? undefined : (this.blob() ?? undefined),
          text: isText ? this.text() : undefined,
          durationSec: isText ? undefined : this.durationSec(),
          deliverAt: deliverAt.toISOString(),
        }),
      );
    } catch {
      this.ui.toast('No pudimos guardar el mensaje. Intenta de nuevo.');
      return;
    }
    this.ui.toast('Tu mensaje quedó guardado con cariño');
    void this.router.navigateByUrl('/perfil/herencia');
  }
}
