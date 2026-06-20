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

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueó:', origin);
      callback(new Error('CORS no permitido'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Manejar preflight antes que cualquier otra ruta
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/events', eventRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TCalendar API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`✅ CORS permitido para:`);
  allowedOrigins.forEach(url => console.log(`   - ${url}`));
});