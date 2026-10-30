import { EmotionId, Resource, Ritual, Specialist } from './models';

export interface EmotionInfo {
  id: EmotionId;
  label: string;
  emoji: string;
  color: string;
  /** Valor para el gráfico de evolución (1 = difícil, 5 = sereno). */
  valence: number;
  what: string;
  why: string;
  expect: string;
  help: string[];
}

export const EMOTIONS: EmotionInfo[] = [
  {
    id: 'tristeza', label: 'Tristeza', emoji: '😢', color: '#7A9EBF', valence: 1,
    what: 'Una sensación profunda de pérdida y vacío.',
    why: 'Aparece porque amaste. Es la forma en que el corazón reconoce la ausencia de alguien importante.',
    expect: 'Llega en olas: a veces suave, a veces intensa, sobre todo en fechas especiales. Con el tiempo las olas se distancian.',
    help: ['Permítete llorar sin culpa', 'Comparte un recuerdo con alguien de confianza', 'Escribe en tu diario lo que extrañas'],
  },
  {
    id: 'rabia', label: 'Rabia', emoji: '😤', color: '#C47A5A', valence: 1,
    what: 'Enojo con la situación, con otros, contigo o incluso con quien partió.',
    why: 'Es una respuesta natural ante algo que sentimos injusto y que no pudimos controlar.',
    expect: 'Puede aparecer de golpe y dirigirse a personas cercanas. Es pasajera si se le da un cauce.',
    help: ['Muévete: camina o haz ejercicio suave', 'Nombra lo que te enoja en voz alta o por escrito', 'Respira profundo antes de responder'],
  },
  {
    id: 'culpa', label: 'Culpa', emoji: '💔', color: '#A89070', valence: 1,
    what: 'La pregunta constante: "¿hice todo lo que pude?".',
    why: 'Nace del amor y del deseo de haber protegido a quien amamos. Es muy común, también en el duelo por mascotas.',
    expect: 'Suele revisar decisiones pasadas una y otra vez. Hablarlo ayuda a ponerla en perspectiva.',
    help: ['Recuerda que decidiste con la información que tenías', 'Escríbele una carta pidiendo o dando perdón', 'Lee el recurso "Culpa del sobreviviente"'],
  },
  {
    id: 'paz', label: 'Paz', emoji: '🕊️', color: '#737B4C', valence: 5,
    what: 'Un momento de aceptación y serenidad.',
    why: 'Llega cuando el recuerdo empieza a traer más gratitud que dolor.',
    expect: 'Puede alternarse con días difíciles; eso no significa retroceder.',
    help: ['Agradece este momento', 'Visita el jardín o enciende una vela', 'Comparte esta sensación con tu familia'],
  },
  {
    id: 'nostalgia', label: 'Nostalgia', emoji: '🌅', color: '#D4A843', valence: 3,
    what: 'Añoranza dulce y amarga por los momentos compartidos.',
    why: 'Aparece con olores, canciones, lugares o fotos que nos conectan con quien partió.',
    expect: 'Mezcla sonrisa y lágrima. Es una forma de mantener viva la memoria.',
    help: ['Mira la galería de recuerdos', 'Cocina su plato favorito', 'Cuenta una anécdota en el muro familiar'],
  },
  {
    id: 'ansiedad', label: 'Ansiedad', emoji: '😰', color: '#9B8BB4', valence: 2,
    what: 'Inquietud, tensión o miedo ante lo que viene.',
    why: 'La pérdida nos recuerda que no todo está bajo control y el cuerpo se pone en alerta.',
    expect: 'Puede afectar el sueño y la concentración. Si es persistente, conviene pedir apoyo profesional.',
    help: ['Respira: inhala 4, sostén 4, exhala 6', 'Haz el test de bienestar', 'Contacta a un especialista en duelo'],
  },
  {
    id: 'tranquilidad', label: 'Tranquilidad', emoji: '🍃', color: '#8BB4A0', valence: 4,
    what: 'Calma en el cuerpo y en la mente.',
    why: 'Señal de que estás encontrando formas de sostener el duelo.',
    expect: 'Puede durar horas o días. Disfrútala sin culpa.',
    help: ['Anota qué te ayudó a llegar aquí', 'Sal a caminar al aire libre', 'Medita unos minutos en silencio'],
  },
  {
    id: 'dolor', label: 'Dolor', emoji: '🥀', color: '#C47A8A', valence: 1,
    what: 'Un dolor que se siente también en el cuerpo: pecho apretado, cansancio.',
    why: 'El duelo es una experiencia física además de emocional.',
    expect: 'Es más intenso al principio y en fechas significativas.',
    help: ['Descansa y aliméntate aunque cueste', 'Pide un abrazo', 'No tomes decisiones grandes hoy'],
  },
  {
    id: 'calma', label: 'Calma', emoji: '🌊', color: '#7AA8B4', valence: 4,
    what: 'Un respiro entre las olas del duelo.',
    why: 'La mente necesita pausas para procesar la pérdida.',
    expect: 'Puede ir y venir; cada momento de calma también cuenta.',
    help: ['Escucha un audio de la biblioteca', 'Escribe una línea en tu diario', 'Riega una planta o el árbol del jardín'],
  },
  {
    id: 'alegria', label: 'Alegría', emoji: '🌻', color: '#D4B843', valence: 5,
    what: 'Momentos de luz y risa, incluso recordando.',
    why: 'La alegría no traiciona la memoria: también es parte del amor.',
    expect: 'A veces viene acompañada de culpa; recuerda que tu ser querido querría verte bien.',
    help: ['Celebra el recuerdo con tu familia', 'Publica una foto feliz', 'Agradece este día'],
  },
];

export const EMOTION_BY_ID = Object.fromEntries(EMOTIONS.map(e => [e.id, e])) as Record<EmotionId, EmotionInfo>;

export const RESOURCES: Resource[] = [
  {
    id: 'fases-duelo', title: 'Las fases del duelo', kind: 'articulo', minutes: 8, icon: '📖',
    image: 'assets/img/fases-del-duelo.jpg', tags: ['persona', 'mascota'],
    summary: 'Negación, rabia, negociación, tristeza y aceptación: un mapa, no una regla.',
    body: [
      'El duelo no es una línea recta. Elisabeth Kübler-Ross describió cinco etapas que muchas personas reconocen: negación, rabia, negociación, tristeza y aceptación.',
      'No todas las personas pasan por todas, ni en ese orden. Puedes sentir varias en un mismo día o volver a una que creías superada.',
      'Lo importante es reconocer lo que sientes sin juzgarte. Cada fase cumple una función: protegerte, darte energía, buscar sentido, permitirte sentir y, finalmente, reorganizar tu vida con el recuerdo.',
      'Si alguna etapa se vuelve muy intensa o se prolonga por meses sin cambios, buscar apoyo profesional es un acto de cuidado.',
    ],
  },
  {
    id: 'depresion', title: 'Depresión post mortem', kind: 'articulo', minutes: 6, icon: '🌧️',
    image: 'assets/img/depresion-post-mortem.png', tags: ['persona', 'mascota'],
    summary: 'Cuándo la tristeza del duelo necesita más acompañamiento.',
    body: [
      'Es normal sentir tristeza profunda después de una pérdida. La diferencia con una depresión está en la duración, la intensidad y el impacto en la vida diaria.',
      'Algunas señales de alerta: no poder levantarse durante semanas, perder el interés por todo, cambios fuertes en el sueño o el apetito, o pensamientos de no querer vivir.',
      'Si reconoces estas señales, habla con alguien de confianza y contacta a un profesional. En Mi Bienestar encontrarás especialistas en duelo.',
      'Si tienes pensamientos de hacerte daño, llama a Salud Responde (600 360 7777) o acude a un servicio de urgencia.',
    ],
  },
  {
    id: 'ansiedad', title: 'Ansiedad y duelo', kind: 'audio', minutes: 10, icon: '🫁',
    image: 'assets/img/ansiedad-y-duelo.jpg', tags: ['persona', 'mascota'],
    summary: 'Un ejercicio guiado de respiración para los momentos de angustia.',
    body: [
      'Busca una posición cómoda. Puedes cerrar los ojos si lo deseas.',
      'Inhala por la nariz contando hasta cuatro. Sostén el aire contando hasta cuatro. Exhala lentamente por la boca contando hasta seis.',
      'Repite este ciclo cinco veces. Nota cómo tus hombros bajan y tu pecho se suaviza.',
      'Ahora trae a tu mente un recuerdo amable de tu ser querido. No tienes que hacer nada con él, solo dejarlo estar.',
      'Cuando estés lista o listo, vuelve a abrir los ojos. Puedes repetir este ejercicio cada vez que lo necesites.',
    ],
  },
  {
    id: 'culpa', title: 'Culpa del sobreviviente', kind: 'articulo', minutes: 7, icon: '💭',
    image: 'assets/img/culpa-del-sobreviviente.jpg', tags: ['persona', 'mascota'],
    summary: '"¿Hice todo lo que pude?" Cómo acompañar esta pregunta.',
    body: [
      'La culpa es una de las emociones más frecuentes en el duelo, y también una de las más silenciosas.',
      'En el duelo por mascotas aparece con fuerza: decisiones sobre tratamientos o la eutanasia suelen revisarse una y otra vez.',
      'Recuerda que tomaste decisiones con la información y los recursos que tenías en ese momento, y desde el amor.',
      'Escribir una carta a tu ser querido, contando lo que sientes, puede ayudar a transformar la culpa en gratitud.',
    ],
  },
  {
    id: 'ninos', title: 'Cómo hablar con niños', kind: 'articulo', minutes: 9, icon: '🧸',
    image: 'assets/img/como-hablar-con-ninos.png', tags: ['persona', 'mascota'],
    summary: 'Palabras simples y honestas para explicar la muerte a los más pequeños.',
    body: [
      'Los niños también viven el duelo, aunque lo expresen de forma distinta: con juegos, preguntas repetidas o cambios de conducta.',
      'Usa palabras claras como "murió" en lugar de "se durmió" o "se fue de viaje", que pueden generar confusión o miedo.',
      'Invítalos a participar en rituales: dibujar algo para el ser querido, plantar una flor o encender una vela.',
      'Está bien que te vean triste. Les enseña que sentir es parte de amar.',
    ],
  },
  {
    id: 'fechas', title: 'Fechas especiales', kind: 'articulo', minutes: 5, icon: '📅',
    image: 'assets/img/fechas-especiales.png', tags: ['persona', 'mascota'],
    summary: 'Cumpleaños, aniversarios y fiestas: cómo prepararse.',
    body: [
      'Las fechas significativas suelen reactivar el dolor, incluso años después.',
      'Planificar ayuda: decide con tu familia si quieren hacer algo especial o simplemente acompañarse.',
      'Los rituales del calendario pueden darle sentido al día: encender una vela, cocinar su plato favorito o visitar el jardín.',
      'Date permiso para cambiar de planes si lo necesitas.',
    ],
  },
  {
    id: 'acompanar', title: 'Acompañar a alguien en duelo', kind: 'audio', minutes: 6, icon: '🤝',
    image: 'assets/img/acompanamiento-en-duelo.jpg', tags: ['persona', 'mascota'],
    summary: 'Qué decir, qué no decir y cómo estar presente.',
    body: [
      'No necesitas tener las palabras perfectas. Estar presente vale más que cualquier consejo.',
      'Evita frases como "ya pasará" o "era solo un perro". Prefiere "estoy aquí" o "¿quieres contarme de él?".',
      'Ofrece ayuda concreta: cocinar, hacer un trámite, acompañar a una visita.',
      'Recuerda las fechas importantes y escribe ese día. El apoyo suele desaparecer con el tiempo; tu constancia hace la diferencia.',
    ],
  },
  {
    id: 'arcoiris', title: 'El Puente del Arcoíris', kind: 'articulo', minutes: 4, icon: '🌈',
    image: 'assets/img/plantando.png', tags: ['mascota'],
    summary: 'Una historia de consuelo para quienes despiden a su compañero animal.',
    body: [
      'Dice la historia que, cuando un animal querido parte, llega a un prado verde junto al Puente del Arcoíris.',
      'Allí corre libre, sin dolor, con agua fresca y sol tibio, jugando con otros compañeros.',
      'Solo extraña una cosa: a ti. Y un día, cuando sea el momento, cruzarán juntos el puente.',
      'El duelo por una mascota es real y merece ser honrado. Su amor incondicional sigue siendo parte de tu historia.',
    ],
  },
];

export const RITUALS: Ritual[] = [
  { id: 'vela', emoji: '🕯️', title: 'Encender una vela', description: 'Un momento de silencio para honrar su memoria', minutes: 5 },
  { id: 'plato', emoji: '🍲', title: 'Cocinar su plato favorito', description: 'Recrear la receta que tanto le gustaba', minutes: 60 },
  { id: 'carta', emoji: '💌', title: 'Escribirle una carta', description: 'Comparte tus pensamientos más íntimos', minutes: 20 },
  { id: 'jardin', emoji: '🌳', title: 'Visitar el jardín', description: 'Ir a su árbol en el jardín memorial', minutes: 120 },
  { id: 'recuerdo', emoji: '📸', title: 'Compartir un recuerdo', description: 'Publicar una foto o historia familiar', minutes: 10 },
  { id: 'meditacion', emoji: '🧘', title: 'Meditación de recuerdo', description: 'Un momento de silencio y gratitud', minutes: 15 },
  { id: 'musica', emoji: '🎵', title: 'Escuchar su música', description: 'Poner las canciones que le hacían feliz', minutes: 30 },
  { id: 'regar', emoji: '💧', title: 'Regar el árbol', description: 'Cuidar el árbol que crece con su memoria', minutes: 15 },
];

export const SPECIALISTS: Specialist[] = [
  {
    id: 'carmen-rojas', name: 'Ps. Carmen Rojas', title: 'Psicóloga clínica',
    specialties: ['Duelo', 'Terapia familiar'], modality: ['Online', 'Presencial'], city: 'Santiago',
    bio: 'Más de 12 años acompañando procesos de duelo en adultos y familias. Enfoque humanista y compasivo.',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format',
    email: 'carmen.rojas@ejemplo.cl', phone: '+56 9 1234 5678', rating: 4.9,
    slots: ['Lun 10:00', 'Lun 16:00', 'Mié 11:00', 'Jue 18:00'], petGrief: false,
  },
  {
    id: 'andres-munoz', name: 'Ps. Andrés Muñoz', title: 'Psicólogo',
    specialties: ['Duelo', 'Ansiedad'], modality: ['Online'], city: 'Valparaíso',
    bio: 'Especialista en duelo y ansiedad. Trabaja con terapia cognitivo-conductual y mindfulness.',
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format',
    email: 'andres.munoz@ejemplo.cl', phone: '+56 9 2345 6789', rating: 4.8,
    slots: ['Mar 09:00', 'Mar 19:00', 'Vie 10:00'], petGrief: false,
  },
  {
    id: 'valentina-soto', name: 'Ps. Valentina Soto', title: 'Psicóloga infanto-juvenil',
    specialties: ['Duelo infantil', 'Terapia familiar'], modality: ['Presencial'], city: 'Santiago',
    bio: 'Acompaña a niños, niñas y adolescentes en procesos de pérdida, con juego y arte terapia.',
    photoUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format',
    email: 'valentina.soto@ejemplo.cl', phone: '+56 9 3456 7890', rating: 4.9,
    slots: ['Lun 15:00', 'Mié 15:00', 'Sáb 10:00'], petGrief: false,
  },
  {
    id: 'javiera-lagos', name: 'Ps. Javiera Lagos', title: 'Psicóloga',
    specialties: ['Duelo por mascotas', 'Duelo'], modality: ['Online'], city: 'Concepción',
    bio: 'Pionera en acompañar el duelo por animales de compañía, un duelo muchas veces no reconocido.',
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&auto=format',
    email: 'javiera.lagos@ejemplo.cl', phone: '+56 9 4567 8901', rating: 5,
    slots: ['Mar 12:00', 'Jue 12:00', 'Jue 20:00'], petGrief: true,
  },
];

export const WELLNESS_QUESTIONS = [
  '¿Cómo te has sentido esta semana?',
  '¿Has podido dormir y descansar?',
  '¿Te sientes acompañada o acompañado?',
  '¿Has podido realizar tus actividades diarias?',
  '¿Sientes esperanza respecto al futuro?',
];

export const WELLNESS_SCALE = ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'];
