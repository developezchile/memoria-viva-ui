// Utilidades de fechas del perfil memorial y la bóveda.

const DAY = 86_400_000;

/** Fechas "AAAA-MM-DD" se leen a mediodía local para que no cambien de día por zona horaria. */
export function toDate(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
}

/** Días que faltan (redondeado hacia arriba) hasta una fecha. */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((toDate(iso).getTime() - Date.now()) / DAY));
}

/** "4 años", "7 meses" o "unos días" desde una fecha pasada. */
export function elapsedText(iso: string): string {
  const from = toDate(iso);
  const now = new Date();
  let months = (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth();
  if (now.getDate() < from.getDate()) months--;
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  return 'unos días';
}
