# TCALENDAR

Calendario colaborativo con backend Node.js + Express + MongoDB y frontend React + TailwindCSS.

## Estructura

- `backend/`: API REST con autenticación JWT y modelos de usuario, grupo y evento.
- `frontend/`: UI React con rutas de login, registro, dashboard y calendario grupal.

## Instalación y configuración

### 1. Configurar MongoDB

#### Opción A: Usar Docker (Recomendado)

Si tienes Docker instalado:

```bash
docker-compose up -d
```

Esto levantará:
- MongoDB en puerto 27017
- Mongo Express (interfaz web) en puerto 8081

#### Opción B: Instalar MongoDB localmente

Descarga e instala MongoDB desde: https://www.mongodb.com/try/download/community

Después de instalar, asegúrate de que el servicio de MongoDB esté corriendo.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

El servidor estará disponible en: http://localhost:5000

**Endpoints disponibles:**
- `POST /api/auth/register` - Crear cuenta
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/groups` - Crear grupo
- `GET /api/groups` - Obtener grupos del usuario
- `POST /api/groups/:groupId/invite` - Invitar usuario al grupo
- `POST /api/groups/:groupId/events` - Crear evento
- `GET /api/groups/:groupId/events` - Obtener eventos del grupo
- `DELETE /api/events/:eventId` - Eliminar evento
- `GET /api/groups/:groupId/members` - Obtener miembros

### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

El servidor estará disponible en: http://localhost:5173

## Variables de entorno

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/tcalendar
JWT_SECRET=tu_secreto_jwt_supersecreto_2024
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

## Cómo usar la aplicación

1. **Registrarse**: Ve a http://localhost:5173 y crea una cuenta con usuario y contraseña
2. **Iniciar sesión**: Usa tus credenciales
3. **Crear grupo**: Desde el dashboard, haz clic en "Nuevo grupo"
4. **Invitar miembros**: Dentro de un grupo, invita a otros usuarios por su nombre de usuario
5. **Crear eventos**: Haz clic en una fecha en el calendario para crear un evento
6. **Ver detalles**: Haz clic en un evento para ver detalles y eliminarlo (si eres el creador)

## Despliegue en producción

- Frontend en Vercel o Netlify
- Backend en Render o Railway
- MongoDB Atlas para base de datos en la nube

## Solución de problemas

### MongoDB no se conecta
- Asegúrate de que MongoDB esté corriendo en puerto 27017
- Si usas Docker: `docker-compose up -d`
- Verifica que MONGODB_URI en .env sea correcto

### Port 5000 o 5173 ya está en uso
- Cambia el PORT en backend/.env
- O detén el proceso que usa ese puerto

### CORS errors
- Asegúrate de que CLIENT_URL en backend/.env apunta a tu frontend

