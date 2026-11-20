const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const createCorsConfig = require('./src/config/cors');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const inviteRoutes = require('./src/routes/inviteRoutes');
const pushRoutes = require('./src/routes/pushRoutes');

dotenv.config();
connectDB();

const app = express();
app.set('trust proxy', 1); // detrás del proxy de Render: sin esto todos los usuarios compartirían la misma IP

const { allowedOrigins, corsOptions } = createCorsConfig(process.env.CLIENT_URL);

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // el frontend vive en otro dominio

const limiter = (opts) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' },
  ...opts,
});
app.use(limiter({ windowMs: 15 * 60 * 1000, limit: 600 }));
// Login: solo cuentan los intentos fallidos, así una red compartida (colegio, oficina) no se bloquea por entrar bien.
app.use('/auth/login', limiter({ windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true }));
app.use('/auth/register', limiter({ windowMs: 60 * 60 * 1000, limit: 20 }));
app.use(express.json({ limit: '10kb' }));

// Sirve para despertar el servidor (Render gratis se duerme) y para monitoreo.
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/events', eventRoutes);
app.use('/invites', inviteRoutes);
app.use('/push', pushRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TCalendar API is running' });
});

// Errores no capturados (JSON mal formado, CORS, etc.): responder JSON en vez de HTML.
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(err.status || 500).json({ message: 'Error del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ CORS permitido para:`);
  allowedOrigins.forEach(url => console.log(`   - ${url}`));
});