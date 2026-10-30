import { Pipe, PipeTransform } from '@angular/core';

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "hace 2 días", "en 3 semanas", "ahora". Uso: `{{ post.createdAt | timeAgo }}` */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(iso: string | undefined | null): string {
    if (!iso) return '';
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, secs] of UNITS) {
      if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
    }
    return 'ahora';
  }
}
