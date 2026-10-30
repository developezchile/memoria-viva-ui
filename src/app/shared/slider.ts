import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/** Deslizador con relleno verde y etiquetas min/valor/max. Uso: `<mv-slider [(value)]="intensidad" />` */
@Component({
  selector: 'mv-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .labels { display: flex; justify-content: space-between; margin-top: 4px; }
    .labels span { font-size: 10px; color: var(--texto-sec); }
    .labels .value { font-size: 12px; font-weight: 600; color: var(--madera); }
  `,
  template: `
    <input
      type="range"
      class="slider-input"
      [min]="min()"
      [max]="max()"
      [value]="value()"
      [style.background]="track()"
      (input)="value.set(+$any($event.target).value)"
    />
    <div class="labels">
      <span>{{ min() }}</span>
      <span class="value">{{ value() }}</span>
      <span>{{ max() }}</span>
    </div>
  `,
})
export class Slider {
  readonly value = model(5);
  readonly min = input(1);
  readonly max = input(10);

  protected readonly track = computed(() => {
    const pct = ((this.value() - this.min()) / (this.max() - this.min())) * 100;
    return `linear-gradient(to right, #737B4C ${pct}%, #D4C5A9 ${pct}%)`;
  });
}
