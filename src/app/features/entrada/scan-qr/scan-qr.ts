import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { VALID_GARDEN_CODES } from '../../../core/data/seed';
import { Session } from '../../../core/services/session';
import { Icon } from '../../../shared/icon';

// BarcodeDetector aún no está en los tipos de TypeScript.
declare const BarcodeDetector: {
  new (opts: { formats: string[] }): { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
};

type CameraState = 'starting' | 'scanning' | 'unavailable';

/** 6. Escanear QR del jardín (con cámara real si el navegador lo permite) o ingresar el código. */
@Component({
  selector: 'mv-scan-qr',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  template: `
    <div class="top">
      <a class="back" routerLink="/onboarding/2" aria-label="Volver"><mv-icon name="arrow-left" [size]="20" color="#FFFFFF" /></a>
      <h1>Escanear Jardín</h1>
    </div>

    <div class="screen-body body">
      <p class="hint">Apunta al código QR de la placa del jardín memorial</p>

      <div class="frame">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>
        <div class="viewport">
          <video #video playsinline muted [class.hidden]="camera() !== 'scanning'"></video>
          @if (camera() === 'starting') {
            <p class="cam-msg">Abriendo la cámara…</p>
          } @else if (camera() === 'unavailable') {
            <div class="cam-msg">
              <mv-icon name="camera" [size]="32" color="rgba(255,255,255,0.6)" />
              <p>{{ cameraMessage() }}</p>
            </div>
          }
        </div>
        @if (camera() === 'scanning') {
          <div class="scan-line"></div>
        }
      </div>

      <form class="manual" (submit)="$event.preventDefault(); submitManual()">
        <label class="manual-label" for="codigo">o ingresa el código del jardín</label>
        <div class="manual-row">
          <input
            id="codigo"
            class="code"
            type="text"
            autocomplete="off"
            autocapitalize="characters"
            maxlength="7"
            placeholder="MV-0000"
            [value]="code()"
            (input)="onType($any($event.target).value)"
            [attr.aria-invalid]="!!error()"
            aria-describedby="codigo-error"
          />
          <button class="go" type="submit" [disabled]="code().length < 7">Validar</button>
        </div>
        @if (error()) {
          <!-- 0.5B Error de código -->
          <p id="codigo-error" class="err" role="alert">{{ error() }}</p>
        }
      </form>

      <button type="button" class="demo" (click)="accept(demoCode)">Simular escaneo (demo)</button>
    </div>
  `,
  styles: `
    :host { background: #1a1a1a; color: #fff; }
    .top { display: flex; align-items: center; gap: 12px; padding: 48px 16px 8px; flex-shrink: 0; }
    .back {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.15);
    }
    h1 { font-family: var(--font-titulo); font-size: 1.125rem; font-weight: 600; }
    .body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 12px 24px 32px; }
    .hint { font-size: 0.875rem; color: rgba(255, 255, 255, 0.75); text-align: center; }

    .frame { position: relative; width: 240px; height: 240px; flex-shrink: 0; }
    .corner { position: absolute; z-index: 1; width: 32px; height: 32px; border: 0 solid var(--verde); }
    .tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 6px; }
    .tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 6px; }
    .bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 6px; }
    .br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 6px; }
    .viewport {
      position: absolute; inset: 8px; overflow: hidden; border-radius: 10px;
      background: #262626 url('/assets/img/quillay.jpg') center / cover;
      display: flex; align-items: center; justify-content: center;
    }
    .viewport::before { content: ''; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.55); }
    video { position: relative; width: 100%; height: 100%; object-fit: cover; }
    video.hidden { display: none; }
    .cam-msg { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; text-align: center; font-size: 0.8125rem; color: rgba(255, 255, 255, 0.75); }
    .scan-line {
      position: absolute; left: 12px; right: 12px; height: 2px; top: 12%;
      background: linear-gradient(to right, transparent, var(--verde), transparent);
      animation: scan 2.4s ease-in-out infinite alternate;
    }
    @keyframes scan { to { top: 86%; } }

    .manual { width: 100%; }
    .manual-label { display: block; margin-bottom: 8px; font-size: 0.8125rem; color: rgba(255, 255, 255, 0.7); text-align: center; }
    .manual-row { display: flex; gap: 8px; }
    .code {
      flex: 1; min-width: 0; height: 52px; padding: 0 16px; border-radius: 12px; outline: none;
      background: rgba(255, 255, 255, 0.08); border: 1.5px solid rgba(255, 255, 255, 0.2);
      color: #fff; font-family: var(--font-cuerpo); font-size: 1.25rem; font-weight: 600; letter-spacing: 3px; text-align: center;
    }
    .code:focus { border-color: var(--verde); }
    .code::placeholder { color: rgba(255, 255, 255, 0.3); }
    .go {
      height: 52px; padding: 0 18px; border: none; border-radius: 12px; cursor: pointer;
      background: var(--verde); color: #fff; font-size: 0.9375rem; font-weight: 600;
    }
    .go:disabled { opacity: 0.45; cursor: not-allowed; }
    .err { margin-top: 10px; font-size: 0.8125rem; color: #f0b8a8; text-align: center; }
    .demo { background: none; border: none; cursor: pointer; color: rgba(255, 255, 255, 0.6); font-size: 0.8125rem; text-decoration: underline; }
  `,
})
export class ScanQr implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(Session);
  private readonly destroyRef = inject(DestroyRef);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  protected readonly camera = signal<CameraState>('starting');
  protected readonly cameraMessage = signal('');
  protected readonly code = signal('');
  protected readonly error = signal('');
  protected readonly demoCode = VALID_GARDEN_CODES[0]!;

  private stream?: MediaStream;
  private stopped = false;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.stopCamera());
    void this.startCamera();
  }

  protected onType(value: string): void {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2, 6);
    this.code.set(v);
    this.error.set('');
  }

  protected submitManual(): void {
    if (!/^MV-[A-Z0-9]{4}$/.test(this.code())) {
      this.error.set('El código debe tener el formato MV-XXXX.');
      return;
    }
    if (!this.accept(this.code())) {
      this.error.set('No encontramos un jardín con ese código. Revisa la placa e inténtalo de nuevo.');
    }
  }

  /** Valida el código (o una URL con ?codigo=) y continúa a la bienvenida. */
  protected accept(raw: string): boolean {
    const code = extractCode(raw);
    if (!code || !this.session.validateGardenCode(code)) return false;
    this.stopCamera();
    this.router.navigateByUrl('/bienvenida');
    return true;
  }

  private async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return this.unavailable('Tu navegador no permite usar la cámara. Ingresa el código manualmente.');
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (this.stopped) return this.stopCamera();
      const el = this.video().nativeElement;
      el.srcObject = this.stream;
      await el.play();
      this.camera.set('scanning');
      if (typeof BarcodeDetector === 'undefined') {
        this.cameraMessage.set('');
        return;
      }
      this.detectLoop(new BarcodeDetector({ formats: ['qr_code'] }), el);
    } catch {
      this.unavailable('No pudimos acceder a la cámara. Puedes ingresar el código manualmente.');
    }
  }

  private detectLoop(detector: InstanceType<typeof BarcodeDetector>, el: HTMLVideoElement): void {
    const tick = async () => {
      if (this.stopped) return;
      try {
        const found = await detector.detect(el);
        for (const f of found) if (this.accept(f.rawValue)) return;
        if (found.length) this.error.set('Ese código QR no corresponde a un jardín de Memoria Viva.');
      } catch {
        /* cuadro no listo */
      }
      setTimeout(tick, 400);
    };
    void tick();
  }

  private unavailable(message: string): void {
    this.camera.set('unavailable');
    this.cameraMessage.set(message);
  }

  private stopCamera(): void {
    this.stopped = true;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
  }
}

function extractCode(raw: string): string | null {
  const text = raw.trim();
  try {
    const fromUrl = new URL(text).searchParams.get('codigo');
    if (fromUrl) return fromUrl.toUpperCase();
  } catch {
    /* no es URL */
  }
  const m = text.toUpperCase().match(/MV-[A-Z0-9]{4}/);
  return m ? m[0] : null;
}
