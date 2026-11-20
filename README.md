# TCalendar

<p align="center">
  <img
    src="./tcalendar-banner.png"
    alt="TCalendar: calendario colaborativo con grupos, eventos y avisos"
    width="900"
  />
</p>

<p align="center">
  <a href="#características">Características</a>
  ·
  <a href="#inicio-rápido">Inicio rápido</a>
  ·
  <a href="#configuración">Configuración</a>
  ·
  <a href="#arquitectura">Arquitectura</a>
  ·
  <a href="#despliegue">Despliegue</a>
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/API-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white" alt="Node.js y Express"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/Web-React%20%2B%20Vite-61DAFB?logo=react&logoColor=0b1f24" alt="React y Vite"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Estilos-Tailwind-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/Datos-MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB"></a>
</p>

**TCalendar** es una aplicación web de calendario colaborativo para equipos, cursos, familias y clubes. Permite organizar eventos por grupo, compartir agendas e invitar a otros miembros sin depender de correos electrónicos.

---

## Características

### Calendarios compartidos

- Crear y administrar grupos.
- Invitar miembros por nombre de usuario o enlace.
- Ver los miembros visibles y distinguir al creador del grupo.
- Personalizar cada grupo con un sello y una fotografía de perfil.

### Gestión de eventos

- Crear eventos desde el calendario.
- Editar, eliminar y mover eventos.
- Cambiar entre vistas mensual, semanal y diaria.
- Arrastrar eventos directamente en la interfaz clásica.
- Exportar la agenda de un grupo como `.ics` para Google Calendar, Apple Calendar u Outlook.

### Cuenta y acceso

- Registro y acceso con usuario y contraseña.
- Bloqueo temporal después de cinco intentos fallidos durante 15 minutos.
- Contraseña de 6 a 64 caracteres.
- Cambio de contraseña desde la cuenta.
- Ocho fotografías de perfil disponibles.
- Restablecimiento de contraseñas por usuarios administradores.

### Personalización

- Temas claro, oscuro o según el sistema.
- Selección de paleta de color.
- Fondos configurables en la interfaz.

### Recordatorios

- Suscripciones push con Web Push.
- Generación de claves VAPID.
- Ejecución diaria de recordatorios para eventos del día siguiente.
- Compatibilidad con instalación de la web app en iPhone.

## Inicio rápido

### Requisitos

- Node.js 18 o superior.
- Una instancia local de MongoDB o un cluster de MongoDB Atlas.
- Dos terminales para ejecutar la API y el frontend durante el desarrollo.

### 1. Configurar el backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

La API se inicia de forma predeterminada en `http://localhost:5000`.

### 2. Configurar el frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

El frontend queda disponible de forma predeterminada en `http://localhost:5173`.

### 3. Ejecutar las pruebas

Las pruebas del backend no requieren una conexión a MongoDB:

```bash
cd backend
npm test
```

## Configuración

### Backend

| Variable | Descripción |
| --- | --- |
| `MONGODB_URI` | Cadena de conexión a MongoDB. |
| `JWT_SECRET` | Secreto aleatorio y suficientemente largo para firmar las sesiones JWT. |
| `CLIENT_URL` | Origen autorizado del frontend. |
| `PORT` | Puerto de la API. El valor predeterminado es `5000`. |
| `ADMIN_USERNAMES` | Usuarios registrados con permiso para restablecer contraseñas, separados por coma. |
| `VAPID_PUBLIC_KEY` | Clave pública para suscripciones push. |
| `VAPID_PRIVATE_KEY` | Clave privada para el envío de notificaciones push. |
| `VAPID_SUBJECT` | Identificador de contacto usado por Web Push, por ejemplo `mailto:...`. |
| `CRON_KEY` | Clave compartida para proteger la ruta de recordatorios programados. |

### Frontend

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base del backend, por ejemplo `http://localhost:5000`. |

## Administración

Los usuarios administradores pueden restablecer contraseñas desde **Mi cuenta → Administración**.

1. Registra primero al usuario que será administrador.
2. Añade su nombre de usuario a `ADMIN_USERNAMES`.
3. Reinicia el backend para aplicar la configuración.

También se puede restablecer una contraseña desde la consola:

```bash
cd backend
npm run reset-password -- <usuario> <contraseña-nueva>
```

Entregá la contraseña nueva mediante un canal privado.

## Recordatorios push

Generá las claves VAPID:

```bash
cd backend
npm run vapid
```

Copiá las claves generadas en `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`, y configurá `CRON_KEY`.

Luego, programá una llamada diaria a:

```text
POST https://TU-BACKEND/push/reminders/run
Header: x-cron-key: <CRON_KEY>
```

La tarea consulta eventos de mañana en UTC. Cada usuario debe activar los avisos desde su cuenta.

> En iPhone, los avisos push requieren instalar TCalendar desde **Compartir → Añadir a inicio**.

## Arquitectura

```text
tcalendar/
├── backend/                  API REST y automatización
│   ├── src/
│   │   ├── config/           Base de datos y CORS
│   │   ├── controllers/      Casos de uso y respuestas HTTP
│   │   ├── middleware/       Autenticación
│   │   ├── models/           Usuarios, grupos, eventos e invitaciones
│   │   ├── routes/           Endpoints públicos y protegidos
│   │   └── utils/            Contraseñas, administración e ICS
│   ├── test/                 Pruebas del backend
│   └── scripts/              Restablecimiento de contraseña
│
└── frontend/                 Aplicación React
    ├── public/
    │   └── avatars/          Avatares locales y créditos
    └── src/
        ├── components/       Calendario, modales y navegación
        ├── contexts/         Sesión, grupos y tema
        ├── lib/              Utilidades de UI
        ├── pages/            Acceso, grupos e invitaciones
        └── services/         Cliente HTTP y push
```

## Despliegue

### Backend

Desplegá `backend/` en Render, Railway u otro proveedor compatible con Node.js.

Configurá como mínimo:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `PORT`, si el proveedor no lo asigna automáticamente

### Frontend

En Vercel, seleccioná `frontend/` como **Root Directory** y definí:

```text
VITE_API_URL=https://TU-BACKEND
```

Podés generar una compilación de producción con:

```bash
cd frontend
npm run build
```

## Seguridad operativa

El backend incluye Helmet y límites por IP:

- 600 solicitudes cada 15 minutos para el límite general.
- 20 intentos de acceso fallidos cada 15 minutos.
- 20 registros por hora.

Usá secretos distintos para desarrollo y producción. No publiques `JWT_SECRET`, claves VAPID privadas ni `CRON_KEY`.

## Estado y licencia

TCalendar es un proyecto web funcional que comparte una sola API y una interfaz React.

El repositorio no declara todavía una licencia global. El paquete `backend/package.json` identifica el backend bajo licencia MIT.

## Créditos

- Tipografías: Bricolage Grotesque y Figtree.
- Iconos: Lucide.
- Avatares locales: [créditos y procedencia](./frontend/public/avatars/CREDITS.md).
