import {
  CalendarEvent, DiaryEntry, EmotionLog, Family, Member, Memorial, Post, Task, TimeMessage, Tribute, User,
} from './models';

// Datos iniciales de la familia de demostración. Las fechas se calculan respecto de hoy
// para que la bóveda, el calendario y el historial siempre tengan sentido.

const DAY = 86_400_000;
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const daysAhead = (n: number, hour = 10) => daysAgo(-n, hour);

/** Próxima ocurrencia (hoy o futura) de un mes/día. */
const nextOccurrence = (month: number, day: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day, 10);
  if (d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

export const DEMO_EMAIL = 'carolina@memoriaviva.cl';

export const SEED_FAMILY: Family = { id: 'f-acuna', surname: 'Acuña', garden: 'Jardín Las Palmas', code: 'MV-0001' };

/** Códigos de jardín válidos para la demo (el QR simulado entrega el primero). */
export const VALID_GARDEN_CODES = ['MV-0001', 'MV-2024', 'MV-1942'];

export function seedMembers(): Member[] {
  return [
    { id: 'm-carolina', name: 'Carolina Acuña', initials: 'CA', relation: 'Nieta/Nieto', avatarColor: '#EBDFC6', userId: 'u-carolina', isAdmin: true },
    { id: 'm-mariaelena', name: 'María Elena Acuña', initials: 'ME', relation: 'Hija/Hijo', avatarColor: '#E8D5C4' },
    { id: 'm-carlos', name: 'Carlos Acuña', initials: 'CA', relation: 'Hija/Hijo', avatarColor: '#D9E0C8' },
    { id: 'm-ana', name: 'Ana Fuentes', initials: 'AF', relation: 'Nieta/Nieto', avatarColor: '#E3D9EE' },
    { id: 'm-pedro', name: 'Pedro Acuña', initials: 'PA', relation: 'Hermana/Hermano', avatarColor: '#D6E4EA' },
  ];
}

export function seedUsers(): User[] {
  return [
    {
      id: 'u-carolina',
      email: DEMO_EMAIL,
      // SHA-256 de "memoria-viva:<contraseña>"; la contraseña de la demo está en el README.
      passwordHash: 'ab4b24265def73276aae1020a418aa042031646790ba53b7e184e41caa6acaeb',
      memberId: 'm-carolina',
      createdAt: daysAgo(120),
    },
  ];
}

export function seedMemorials(): Memorial[] {
  return [
    {
      id: 'mem-jaime', kind: 'persona', name: 'Tata Jaime', initials: 'TJ', epitaph: 'Abuelo querido',
      birthDate: '1942-05-08', deathDate: '2022-02-20',
      bio: 'Carpintero de manos generosas y risa contagiosa. Le encantaba cuidar su huerto, contar historias del sur y preparar porotos granados los domingos.',
      photoUrl: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=400&fit=crop&auto=format',
      tree: { species: 'Quillay', garden: 'Jardín Las Palmas', plantedAt: '2022-03-15', heightM: 4.2 },
    },
    {
      id: 'mem-luna', kind: 'mascota', name: 'Luna', initials: 'LU', epitaph: 'Nuestra compañera fiel',
      birthDate: '2010-09-01', deathDate: '2024-06-12', species: 'Perrita mestiza',
      bio: 'Llegó a la casa como cachorra y nos acompañó catorce años. Amaba correr en la playa y dormir al sol en el patio.',
      photoUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&auto=format',
    },
  ];
}

export function seedPosts(): Post[] {
  return [
    {
      id: 'p-1', authorId: 'm-mariaelena', createdAt: daysAgo(1, 19),
      text: 'Hoy encontré la vieja caja de herramientas del papá. Todavía huele a madera y aserrín. Me senté un rato en el taller y le conté cómo están los nietos. 🌳',
      taggedIds: ['mem-jaime', 'm-carlos'],
      reactions: { 'm-carlos': 'corazon', 'm-ana': 'flor', 'm-pedro': 'vela' },
      comments: [
        { id: 'c-1', authorId: 'm-carlos', text: 'Qué lindo, hermana. Podríamos restaurar el banco que estaba haciendo.', createdAt: daysAgo(1, 20) },
        { id: 'c-2', authorId: 'm-ana', text: 'Me acuerdo cuando me enseñó a lijar ❤️', createdAt: daysAgo(0, 9) },
      ],
    },
    {
      id: 'p-2', authorId: 'm-carlos', createdAt: daysAgo(3, 13),
      text: 'Fuimos al jardín a regar el Quillay. ¡Está enorme! Ya mide más de cuatro metros.',
      imageUrl: 'assets/img/quillay.jpg',
      taggedIds: ['mem-jaime'],
      reactions: { 'm-mariaelena': 'corazon', 'm-carolina': 'flor' },
      comments: [],
    },
    {
      id: 'p-3', authorId: 'm-ana', createdAt: daysAgo(6, 21),
      text: 'Extraño a la Luna cada vez que paso por la playa. Le habría encantado este atardecer. 🌈',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&auto=format',
      taggedIds: ['mem-luna'],
      reactions: { 'm-carolina': 'corazon', 'm-mariaelena': 'corazon' },
      comments: [{ id: 'c-3', authorId: 'm-carolina', text: 'Ella corría feliz ahí. Gracias por compartirlo.', createdAt: daysAgo(5, 8) }],
    },
  ];
}

export function seedTributes(): Tribute[] {
  return [
    { id: 't-1', memorialId: 'mem-jaime', authorId: 'm-pedro', kind: 'vela', text: 'Hermano, te recuerdo cada mañana con el mate.', createdAt: daysAgo(2) },
    { id: 't-2', memorialId: 'mem-jaime', authorId: 'm-ana', kind: 'flor', text: 'Gracias por enseñarme a mirar los árboles, tata.', createdAt: daysAgo(9) },
    { id: 't-3', memorialId: 'mem-luna', authorId: 'm-carolina', kind: 'flor', text: 'Corre libre, Lunita.', createdAt: daysAgo(30) },
  ];
}

export function seedTimeMessages(): TimeMessage[] {
  return [
    {
      id: 'tm-1', fromId: 'mem-jaime', toIds: ['m-carolina', 'm-ana'], title: 'Para mis nietas', format: 'texto',
      text: 'Mis niñas: cuando lean esto quiero que sepan que fueron la alegría de mis últimos años. Cuiden el huerto, cuiden a su abuela y no dejen nunca de reírse fuerte. Los quiero hasta el cielo. — El Tata',
      deliverAt: daysAgo(40), createdAt: '2021-11-02T10:00:00.000Z',
    },
    {
      id: 'tm-2', fromId: 'mem-jaime', toIds: [], title: 'Para el primer encuentro familiar', format: 'texto',
      text: 'Familia querida: si están todos juntos, entonces valió la pena. Sirvan un vaso de vino por mí y cuenten la historia del bote que se hundió en Chiloé.',
      deliverAt: daysAhead(25), createdAt: '2021-12-24T10:00:00.000Z',
    },
    {
      id: 'tm-3', fromId: 'mem-jaime', toIds: ['m-mariaelena'], title: 'Para tu cumpleaños 60', format: 'texto',
      text: 'Hija, sesenta años y sigues siendo mi niña.',
      deliverAt: daysAhead(210), createdAt: '2022-01-10T10:00:00.000Z',
    },
    {
      id: 'tm-4', fromId: 'm-carolina', toIds: ['m-ana'], title: 'Para cuando te titules', format: 'texto',
      text: 'Prima: lo lograste. El tata estaría orgulloso.',
      deliverAt: daysAhead(400), createdAt: daysAgo(15),
    },
  ];
}

export function seedEmotionLogs(): EmotionLog[] {
  const plan: [number, EmotionLog['emotion'], number, string][] = [
    [27, 'tristeza', 5, 'Fue su cumpleaños número 84.'],
    [23, 'dolor', 4, ''],
    [19, 'nostalgia', 3, 'Vi fotos del sur.'],
    [15, 'ansiedad', 3, 'No he dormido bien.'],
    [11, 'calma', 3, 'Fui a caminar al cerro.'],
    [7, 'nostalgia', 2, 'Cociné porotos granados.'],
    [4, 'tranquilidad', 3, ''],
    [1, 'paz', 4, 'Regamos el Quillay en familia.'],
  ];
  return plan.map(([d, emotion, intensity, note], i) => ({
    id: `el-${i}`, memberId: 'm-carolina', emotion, intensity, note, date: daysAgo(d), createdAt: daysAgo(d, 21),
  }));
}

export function seedDiary(): DiaryEntry[] {
  return [
    { id: 'd-1', memberId: 'm-carolina', title: 'El huerto', text: 'Hoy planté cilantro como él me enseñó: poco profundo y con paciencia. Sentí que me miraba por encima del hombro.', createdAt: daysAgo(2, 22) },
    { id: 'd-2', memberId: 'm-carolina', title: 'Un sueño', text: 'Soñé con el tata en el taller. No dijo nada, solo sonrió y siguió lijando. Desperté tranquila.', createdAt: daysAgo(12, 8) },
  ];
}

export function seedEvents(): CalendarEvent[] {
  return [
    {
      id: 'ev-1', title: 'Encuentro familiar en el jardín', date: daysAhead(25, 12), kind: 'encuentro',
      description: 'Almuerzo junto al Quillay. Cada uno lleva un plato y una historia del tata.',
      participantIds: ['m-carolina', 'm-mariaelena', 'm-carlos', 'm-ana', 'm-pedro'], memorialIds: ['mem-jaime'],
      ritualIds: ['plato', 'recuerdo'], createdBy: 'm-mariaelena',
    },
    {
      id: 'ev-2', title: 'Cumpleaños del Tata Jaime', date: nextOccurrence(5, 8), kind: 'cumpleanos',
      description: 'Habría cumplido años. Encendemos una vela a las 20:00, cada uno desde su casa.',
      participantIds: ['m-carolina', 'm-mariaelena', 'm-carlos', 'm-ana', 'm-pedro'], memorialIds: ['mem-jaime'],
      ritualIds: ['vela'], createdBy: 'm-carolina',
    },
    {
      id: 'ev-3', title: 'Aniversario de plantación del Quillay', date: nextOccurrence(3, 15), kind: 'aniversario',
      description: 'Visitamos el jardín y medimos cuánto ha crecido el árbol.',
      participantIds: ['m-carlos', 'm-ana'], memorialIds: ['mem-jaime'], ritualIds: ['jardin', 'regar'], createdBy: 'm-carlos',
    },
    {
      id: 'ev-4', title: 'Aniversario de la partida de Luna', date: nextOccurrence(6, 12), kind: 'partida',
      description: 'Paseo por la playa en su honor.',
      participantIds: ['m-carolina', 'm-ana'], memorialIds: ['mem-luna'], ritualIds: [], createdBy: 'm-ana',
    },
  ];
}

export function seedTasks(): Task[] {
  return [
    { id: 'tk-1', title: 'Llevar remedios al abuelo Pedro', assigneeId: 'm-carlos', date: daysAhead(1), done: false, createdBy: 'm-mariaelena' },
    { id: 'tk-2', title: 'Comprar mercadería para tía Rosa', assigneeId: 'm-mariaelena', date: daysAhead(2), done: false, createdBy: 'm-mariaelena' },
    { id: 'tk-3', title: 'Regar árbol del Jardín Las Palmas', assigneeId: 'm-carolina', date: daysAhead(0), done: false, createdBy: 'm-carlos' },
    { id: 'tk-4', title: 'Preparar álbum de fotos para el encuentro', assigneeId: 'todos', date: daysAhead(20), done: false, createdBy: 'm-ana' },
    { id: 'tk-5', title: 'Llamar al psicólogo familiar', assigneeId: 'm-ana', date: daysAgo(1), done: true, createdBy: 'm-ana' },
  ];
}
