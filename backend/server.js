const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const eventRoutes = require('./src/routes/eventRoutes');

dotenv.config();
connectDB();

const app = express();

// 🔥 CONFIGURACIÓN DE CORS - PERMITE TODAS LAS URLS DE VERCEL
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://tcalendar-nine.vercel.app',
  'https://tcalendar-teo72holakases-projects.vercel.app',
  'https://tcalendar-git-main-teo72holakases-projects.vercel.app',
  'https://tcalendar-jivh11mgy-teo72holakases-projects.vercel.app',
  'https://tcalendar-online.vercel.app',
  'https://tcalendar.vercel.app', // ← NUEVA URL GENÉRICA
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueó:', origin);
      callback(new Error('CORS no permitido'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TCalendar API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ CORS permitido para:`);
  allowedOrigins.forEach(url => console.log(`   - ${url}`));
});