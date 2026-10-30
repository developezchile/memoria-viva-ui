// Modelo de datos de Memoria Viva.
// Los identificadores son strings; las fechas, strings ISO 8601.
// Los archivos (fotos, audio, video) se guardan aparte y se referencian por `mediaId`.

export type Id = string;
export type IsoDate = string;

export type Relation =
  | 'Hija/Hijo'
  | 'Pareja'
  | 'Nieta/Nieto'
  | 'Hermana/Hermano'
  | 'Madre/Padre'
  | 'Sobrina/Sobrino'
  | 'Amiga/Amigo'
  | 'Otro';

export const RELATIONS: Relation[] = [
  'Hija/Hijo', 'Pareja', 'Nieta/Nieto', 'Hermana/Hermano', 'Madre/Padre', 'Sobrina/Sobrino', 'Amiga/Amigo', 'Otro',
];

/** Persona viva de la familia que usa (o podría usar) la app. */
export interface Member {
  id: Id;
  name: string;
  initials: string;
  relation: Relation;
  avatarColor: string;
  photoMediaId?: Id;
  /** Solo los miembros registrados tienen cuenta. */
  userId?: Id;
  isAdmin?: boolean;
}

export type MemorialKind = 'persona' | 'mascota';

/** Ser querido fallecido (persona o mascota). Se muestra con marco dorado. */
export interface Memorial {
  id: Id;
  kind: MemorialKind;
  name: string;
  initials: string;
  /** p. ej. "Abuelo querido" o "Nuestra perrita" */
  epitaph: string;
  birthDate: IsoDate;
  deathDate: IsoDate;
  bio: string;
  photoUrl?: string;
  photoMediaId?: Id;
  /** Árbol plantado en el jardín físico. */
  tree?: { species: string; garden: string; plantedAt: IsoDate; heightM: number };
  species?: string;
}

export interface Family {
  id: Id;
  surname: string;
  garden: string;
  /** Código del jardín, formato MV-XXXX. */
  code: string;
}

export interface User {
  id: Id;
  email: string;
  passwordHash: string;
  memberId: Id;
  createdAt: IsoDate;
}

export type ReactionKind = 'corazon' | 'flor' | 'vela';
export const REACTIONS: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: 'corazon', emoji: '❤️', label: 'Corazón' },
  { kind: 'flor', emoji: '🌸', label: 'Flor' },
  { kind: 'vela', emoji: '🕯️', label: 'Vela' },
];

export interface Comment {
  id: Id;
  authorId: Id;
  text: string;
  createdAt: IsoDate;
}

export interface Post {
  id: Id;
  authorId: Id;
  text: string;
  /** Foto subida por el usuario. */
  mediaId?: Id;
  mediaType?: 'image' | 'video';
  /** Imagen de ejemplo (datos semilla). */
  imageUrl?: string;
  /** Miembros y/o seres queridos etiquetados. */
  taggedIds: Id[];
  /** memberId → reacción */
  reactions: Record<Id, ReactionKind>;
  comments: Comment[];
  createdAt: IsoDate;
}

/** Homenaje en el muro del perfil memorial. */
export interface Tribute {
  id: Id;
  memorialId: Id;
  authorId: Id;
  kind: 'flor' | 'vela' | 'mensaje';
  text: string;
  createdAt: IsoDate;
}

/** Mensaje póstumo: grabado o escrito para abrirse en una fecha. */
export interface TimeMessage {
  id: Id;
  /** Quién lo dejó (un ser querido o un miembro vivo, desde "Mi Herencia"). */
  fromId: Id;
  /** Destinatarios (memberIds). Vacío = toda la familia. */
  toIds: Id[];
  title: string;
  format: 'audio' | 'video' | 'texto';
  mediaId?: Id;
  text?: string;
  durationSec?: number;
  deliverAt: IsoDate;
  createdAt: IsoDate;
}

export type EmotionId =
  | 'tristeza' | 'rabia' | 'culpa' | 'paz' | 'nostalgia'
  | 'ansiedad' | 'tranquilidad' | 'dolor' | 'calma' | 'alegria';

export interface EmotionLog {
  id: Id;
  memberId: Id;
  emotion: EmotionId;
  /** 1 a 5 */
  intensity: number;
  note: string;
  /** Día al que corresponde el registro. */
  date: IsoDate;
  createdAt: IsoDate;
}

export interface DiaryEntry {
  id: Id;
  memberId: Id;
  title: string;
  text: string;
  createdAt: IsoDate;
}

export interface Resource {
  id: Id;
  title: string;
  summary: string;
  kind: 'articulo' | 'audio';
  minutes: number;
  image: string;
  icon: string;
  /** Párrafos del artículo. */
  body: string[];
  tags: ('persona' | 'mascota')[];
}

export interface CalendarEvent {
  id: Id;
  title: string;
  date: IsoDate;
  description: string;
  kind: 'cumpleanos' | 'aniversario' | 'partida' | 'encuentro' | 'otro';
  participantIds: Id[];
  /** Seres queridos asociados. */
  memorialIds: Id[];
  ritualIds: Id[];
  createdBy: Id;
}

export interface Task {
  id: Id;
  title: string;
  assigneeId: Id | 'todos';
  date: IsoDate;
  done: boolean;
  createdBy: Id;
}

export interface Ritual {
  id: Id;
  title: string;
  description: string;
  emoji: string;
  minutes: number;
}

export interface Specialist {
  id: Id;
  name: string;
  title: string;
  specialties: string[];
  modality: ('Online' | 'Presencial')[];
  city: string;
  bio: string;
  photoUrl: string;
  email: string;
  phone: string;
  rating: number;
  /** Horarios disponibles como texto, p. ej. "Lun 10:00". */
  slots: string[];
  petGrief: boolean;
}

export interface ContactRequest {
  id: Id;
  specialistId: Id;
  memberId: Id;
  slot: string;
  message: string;
  createdAt: IsoDate;
}

export interface WellnessResult {
  id: Id;
  memberId: Id;
  /** Respuestas 1–5 en el orden de las preguntas. */
  answers: number[];
  score: number;
  createdAt: IsoDate;
}

export interface Settings {
  fontScale: number;
  highContrast: boolean;
  zoom: boolean;
  screenReader: boolean;
  reduceMotion: boolean;
  privateProfile: boolean;
  showMoodToFamily: boolean;
  notifications: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  fontScale: 1,
  highContrast: false,
  zoom: false,
  screenReader: false,
  reduceMotion: false,
  privateProfile: false,
  showMoodToFamily: true,
  notifications: true,
};
