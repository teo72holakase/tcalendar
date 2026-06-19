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
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TCalendar API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
