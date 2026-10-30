import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards';
import { TabId } from './layout/bottom-nav';

const t = (title: string) => `${title} · Memoria Viva`;
const tab = (id: TabId) => ({ tab: id });

export const routes: Routes = [
  // 1. Flujo de entrada
  { path: '', title: 'Memoria Viva', loadComponent: () => import('./features/entrada/splash/splash').then(m => m.Splash) },
  {
    path: 'onboarding/:paso', title: t('Bienvenida'), canActivate: [guestGuard],
    loadComponent: () => import('./features/entrada/onboarding/onboarding').then(m => m.Onboarding),
  },
  { path: 'onboarding', pathMatch: 'full', redirectTo: 'onboarding/1' },
  {
    path: 'escanear', title: t('Escanear QR'), canActivate: [guestGuard],
    loadComponent: () => import('./features/entrada/scan-qr/scan-qr').then(m => m.ScanQr),
  },
  {
    path: 'bienvenida', title: t('Bienvenida al jardín'), canActivate: [guestGuard],
    loadComponent: () => import('./features/entrada/garden-welcome/garden-welcome').then(m => m.GardenWelcome),
  },
  {
    path: 'registro', title: t('Crear perfil'), canActivate: [guestGuard],
    loadComponent: () => import('./features/entrada/register/register').then(m => m.Register),
  },
  {
    path: 'ingresar', title: t('Iniciar sesión'), canActivate: [guestGuard],
    loadComponent: () => import('./features/entrada/login/login').then(m => m.Login),
  },

  // 2. Mi Familia (inicio)
  {
    path: 'familia', title: t('Mi Familia'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/familia/feed/feed').then(m => m.Feed),
  },
  {
    path: 'familia/post/:id', title: t('Publicación'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/familia/post-detail/post-detail').then(m => m.PostDetail),
  },
  {
    path: 'familia/publicado/:id', title: t('¡Publicado!'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/familia/published/published').then(m => m.Published),
  },

  // 3. Perfil memorial
  {
    path: 'memorial/:id', title: t('Perfil memorial'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/memorial/memorial-profile/memorial-profile').then(m => m.MemorialProfile),
  },
  {
    path: 'memorial/:id/boveda', title: t('Bóveda del tiempo'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/memorial/vault/vault').then(m => m.Vault),
  },
  {
    path: 'memorial/:id/boveda/:mensaje', title: t('Mensaje'), canActivate: [authGuard], data: tab('familia'),
    loadComponent: () => import('./features/memorial/message-player/message-player').then(m => m.MessagePlayer),
  },

  // 4. Mi Perfil
  {
    path: 'perfil', title: t('Mi Perfil'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/profile/profile').then(m => m.Profile),
  },
  {
    path: 'perfil/diario', title: t('Mi diario'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/diary/diary').then(m => m.Diary),
  },
  {
    path: 'perfil/estados', title: t('Mis estados de ánimo'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/moods/moods').then(m => m.Moods),
  },
  {
    path: 'perfil/herencia', title: t('Mi Herencia'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/heritage-list/heritage-list').then(m => m.HeritageList),
  },
  {
    path: 'perfil/herencia/nueva', title: t('Nuevo mensaje'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/heritage-create/heritage-create').then(m => m.HeritageCreate),
  },
  {
    path: 'perfil/configuracion', title: t('Configuración'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/settings/settings').then(m => m.SettingsMenu),
  },
  {
    path: 'perfil/configuracion/datos', title: t('Editar datos'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/edit-profile/edit-profile').then(m => m.EditProfile),
  },
  {
    path: 'perfil/configuracion/privacidad', title: t('Privacidad y seguridad'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/privacy/privacy').then(m => m.Privacy),
  },
  {
    path: 'perfil/configuracion/accesibilidad', title: t('Accesibilidad'), canActivate: [authGuard], data: tab('perfil'),
    loadComponent: () => import('./features/perfil/accessibility/accessibility').then(m => m.Accessibility),
  },

  // 5. Mi Duelo
  {
    path: 'duelo', title: t('Mi Duelo'), canActivate: [authGuard], data: tab('duelo'),
    loadComponent: () => import('./features/duelo/grief-home/grief-home').then(m => m.GriefHome),
  },
  {
    path: 'duelo/registrar/:emocion', title: t('Registrar emoción'), canActivate: [authGuard], data: tab('duelo'),
    loadComponent: () => import('./features/duelo/register-emotion/register-emotion').then(m => m.RegisterEmotion),
  },
  {
    path: 'duelo/historial', title: t('Historial emocional'), canActivate: [authGuard], data: tab('duelo'),
    loadComponent: () => import('./features/duelo/emotion-history/emotion-history').then(m => m.EmotionHistory),
  },
  {
    path: 'duelo/recursos', title: t('Biblioteca de recursos'), canActivate: [authGuard], data: tab('duelo'),
    loadComponent: () => import('./features/duelo/resource-library/resource-library').then(m => m.ResourceLibrary),
  },
  {
    path: 'duelo/recursos/:id', title: t('Recurso'), canActivate: [authGuard], data: tab('duelo'),
    loadComponent: () => import('./features/duelo/resource-detail/resource-detail').then(m => m.ResourceDetail),
  },

  // 6. Mi Calendario
  {
    path: 'calendario', title: t('Calendario'), canActivate: [authGuard], data: tab('calendario'),
    loadComponent: () => import('./features/calendario/calendar-home/calendar-home').then(m => m.CalendarHome),
  },
  {
    path: 'calendario/evento/:id', title: t('Evento'), canActivate: [authGuard], data: tab('calendario'),
    loadComponent: () => import('./features/calendario/event-detail/event-detail').then(m => m.EventDetail),
  },
  {
    path: 'calendario/rituales', title: t('Rituales'), canActivate: [authGuard], data: tab('calendario'),
    loadComponent: () => import('./features/calendario/rituals/rituals').then(m => m.Rituals),
  },

  // 7. Mi Bienestar
  {
    path: 'bienestar', title: t('Test de bienestar'), canActivate: [authGuard], data: tab('bienestar'),
    loadComponent: () => import('./features/bienestar/wellness-test/wellness-test').then(m => m.WellnessTest),
  },
  {
    path: 'bienestar/resultado', title: t('Tu bienestar'), canActivate: [authGuard], data: tab('bienestar'),
    loadComponent: () => import('./features/bienestar/wellness-result/wellness-result').then(m => m.WellnessResultPage),
  },
  {
    path: 'bienestar/especialistas', title: t('Especialistas'), canActivate: [authGuard], data: tab('bienestar'),
    loadComponent: () => import('./features/bienestar/specialists/specialists').then(m => m.Specialists),
  },
  {
    path: 'bienestar/especialistas/:id', title: t('Especialista'), canActivate: [authGuard], data: tab('bienestar'),
    loadComponent: () => import('./features/bienestar/specialist-detail/specialist-detail').then(m => m.SpecialistDetail),
  },
  {
    path: 'bienestar/solicitud-enviada', title: t('Solicitud enviada'), canActivate: [authGuard], data: tab('bienestar'),
    loadComponent: () => import('./features/bienestar/request-sent/request-sent').then(m => m.RequestSent),
  },

  // 9. Auxiliares
  { path: '**', title: t('Página no encontrada'), loadComponent: () => import('./features/sistema/not-found/not-found').then(m => m.NotFound) },
];
