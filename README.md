# Memoria Viva — app (Angular)

*La memoria que crece.* App móvil/web de acompañamiento en el duelo (personas y mascotas),
construida con Angular 21 a partir de la **Lista maestra definitiva de pantallas** del
plan de implementación (`docs/plan-implementacion.txt`).

## Ejecutar

```bash
npm install
npx ng serve --port 4310     # http://localhost:4310
npm run build                # producción → dist/ui/browser (PWA con service worker)
```

En escritorio la app se muestra dentro de un marco de teléfono; en el celular ocupa toda la pantalla.

### Cuenta de demostración

| Correo | Contraseña |
| --- | --- |
| `carolina@memoriaviva.cl` | `memoria2026` |

La cuenta demo trae publicaciones, homenajes, diario, estados de ánimo, eventos y tareas.
Una cuenta nueva parte vacía (para ver los estados vacíos).

### Unirse a una familia (registro)

1. Onboarding → **Comenzar** → *Escanear Jardín*.
2. Escanea un QR que contenga `https://<sitio>/?codigo=MV-0001`, escribe el código a mano
   o usa **Simular escaneo (demo)**.
   Códigos válidos de prueba: `MV-0001`, `MV-2024`, `MV-1942`.
3. *Bienvenido a la familia Acuña* → **Entrar** → crear perfil.

Abrir `/?codigo=MV-0001` directamente simula haber llegado desde la placa QR del jardín.

## Estructura

```
src/app/
  core/
    data/        modelos, catálogos (emociones, recursos, rituales, especialistas), datos semilla, persistencia
    services/    stores por dominio: Session, FamilyStore, FeedStore, MemorialStore, GriefStore,
                 CalendarStore, WellnessStore, SettingsStore, MediaStore, Ui
    guards.ts    authGuard / guestGuard
  shared/        íconos, avatar, cabecera, sheet (modal), slider, toggle, estados vacíos, pipes
  layout/        barra inferior, overlays globales (aviso, carga, confirmación, sin conexión)
  features/
    entrada/     splash, onboarding, escanear QR, bienvenida al jardín, registro, login
    familia/     feed (inicio), detalle de publicación, ¡publicado!
    memorial/    perfil memorial, bóveda del tiempo, reproductor de mensaje
    perfil/      mi perfil, diario, estados, mi herencia, configuración, privacidad, accesibilidad
    duelo/       emociones, registrar, historial, biblioteca, detalle de recurso
    calendario/  calendario, evento, rituales
    bienestar/   test, resultado, especialistas, detalle, solicitud enviada
    sistema/     404
```

Cada pantalla es un componente standalone con `host: { class: 'screen' }`, señales y
`ChangeDetectionStrategy.OnPush`. Los parámetros de ruta llegan como `input()`.
Los textos usan `rem`, así el control de tamaño de fuente de Accesibilidad escala toda la app.

## Datos

Los datos se guardan **en el dispositivo**: `localStorage` (prefijo `mv:`) para los datos
y IndexedDB para fotos, audios y videos (`MediaStore`). La app funciona completa sin servidor.
Las pantallas no acceden al almacenamiento directamente; todo pasa por `core/services/`.

Para borrar los datos locales: DevTools → Application → *Clear site data*.
