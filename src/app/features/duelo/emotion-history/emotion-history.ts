import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EMOTION_BY_ID, EmotionInfo } from '../../../core/data/catalog';
import { EmotionLog } from '../../../core/data/models';
import { GriefStore } from '../../../core/services/grief';
import { Ui } from '../../../core/services/ui';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';

const INTENSITY = ['Leve', 'Suave', 'Moderada', 'Intensa', 'Muy intensa'];
const DAY = 86_400_000;
const PAGE = 8;

// Geometría del gráfico (unidades SVG = px).
const CHART_H = 200;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;
const PAD_X = 24;
const STEP = 52;
const MIN_W = 296;

type Trend = 'mejorando' | 'estable' | 'dificil';

interface ChartPoint {
  x: number;
  y: number;
  log: EmotionLog;
  info: EmotionInfo;
  value: number;
}

/** Historial emocional: gráfico de bienestar, análisis y registros. */
@Component({
  selector: 'mv-emotion-history',
  imports: [Header, Icon, EmptyState, RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  templateUrl: './emotion-history.html',
  styleUrl: './emotion-history.scss',
})
export class EmotionHistory {
  private readonly grief = inject(GriefStore);
  private readonly ui = inject(Ui);

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly logs = this.grief.logs;
  protected readonly chartH = CHART_H;
  protected readonly gridLevels = [5, 4, 3, 2, 1];
  protected readonly visible = signal(PAGE);

  protected readonly chartW = computed(() => Math.max(MIN_W, PAD_X * 2 + (this.grief.chart().length - 1) * STEP));

  protected readonly points = computed<ChartPoint[]>(() => {
    const data = this.grief.chart();
    const w = this.chartW();
    const n = data.length;
    // Con pocos puntos, se reparten a lo ancho; con muchos, paso fijo y scroll horizontal.
    const step = n > 1 ? Math.max(STEP, (w - PAD_X * 2) / (n - 1)) : 0;
    return data.map((d, i) => ({
      x: n > 1 ? PAD_X + i * step : w / 2,
      y: this.yFor(d.value),
      log: d.log,
      info: d.info,
      value: d.value,
    }));
  });

  protected readonly linePath = computed(() =>
    this.points().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
  );

  /** Área bajo la línea, para un relleno suave. */
  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    const base = CHART_H - PAD_BOTTOM;
    return `${this.linePath()} L${pts[pts.length - 1].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`;
  });

  // --- Análisis ---

  protected readonly trend = computed<Trend | null>(() => {
    const values = this.grief.chart().map(d => d.value);
    if (values.length < 2) return null;
    const half = Math.floor(values.length / 2);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const diff = avg(values.slice(values.length - half)) - avg(values.slice(0, half));
    if (diff > 0.3) return 'mejorando';
    if (diff < -0.3) return 'dificil';
    return 'estable';
  });

  protected readonly trendText = computed(() => {
    switch (this.trend()) {
      case 'mejorando':
        return { label: 'Mejorando', emoji: '🌱', text: 'Tus últimos días se sienten más serenos. Cada paso cuenta, aunque haya olas.' };
      case 'estable':
        return { label: 'Estable', emoji: '🍃', text: 'Tu sentir se ha mantenido parecido. Sostenerse también es avanzar.' };
      case 'dificil':
        return { label: 'Más difícil', emoji: '🤍', text: 'Estos días han pesado más. Sé amable contigo y busca compañía si la necesitas.' };
      default:
        return { label: 'Aún sin tendencia', emoji: '🌾', text: 'Registra algunos días más para ver cómo cambia tu sentir.' };
    }
  });

  protected readonly topEmotion = computed(() => {
    const counts = new Map<string, number>();
    for (const l of this.logs()) counts.set(l.emotion, (counts.get(l.emotion) ?? 0) + 1);
    let best: { info: EmotionInfo; count: number } | null = null;
    for (const [id, count] of counts) {
      if (!best || count > best.count) best = { info: EMOTION_BY_ID[id as EmotionLog['emotion']], count };
    }
    return best;
  });

  protected readonly avgIntensity = computed(() => {
    const ls = this.logs();
    return ls.length ? ls.reduce((a, l) => a + l.intensity, 0) / ls.length : 0;
  });

  protected readonly last30 = computed(() => {
    const since = Date.now() - 30 * DAY;
    return this.logs().filter(l => new Date(l.date).getTime() >= since).length;
  });

  /** Resumen en texto del gráfico para lectores de pantalla. */
  protected readonly summary = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `Gráfico de bienestar con ${pts.length} registro${pts.length === 1 ? '' : 's'}, del ${fmt(first.log.date)} al ${fmt(last.log.date)}. ` +
      `Empieza en ${first.info.label.toLowerCase()} y el último registro es ${last.info.label.toLowerCase()}. ` +
      `Tendencia: ${this.trendText().label.toLowerCase()}.`;
  });

  protected readonly shown = computed(() => this.logs().slice(0, this.visible()));

  constructor() {
    // El gráfico parte mostrando los registros más recientes.
    afterNextRender(() => {
      const el = this.scroller()?.nativeElement;
      if (el) el.scrollLeft = el.scrollWidth;
    });
  }

  protected yFor(value: number): number {
    const plot = CHART_H - PAD_TOP - PAD_BOTTOM;
    return PAD_TOP + ((5 - value) / 4) * plot;
  }

  protected info(log: EmotionLog): EmotionInfo {
    return EMOTION_BY_ID[log.emotion];
  }

  protected intensityLabel(n: number): string {
    return INTENSITY[n - 1] ?? '';
  }

  protected showMore(): void {
    this.visible.update(v => v + PAGE);
  }

  protected async remove(log: EmotionLog): Promise<void> {
    const ok = await this.ui.confirm({
      title: '¿Eliminar este registro?',
      message: `Se borrará tu registro de ${this.info(log).label.toLowerCase()}. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Conservar',
      danger: true,
    });
    if (!ok) return;
    this.grief.deleteLog(log.id);
    this.ui.toast('Registro eliminado');
  }
}
