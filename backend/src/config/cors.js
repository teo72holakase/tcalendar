const createCorsConfig = (clientUrl) => {
  const clientOrigin = clientUrl ? new URL(clientUrl).origin : null;
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tcalendar.devs.surf',
    clientOrigin
  ].filter(Boolean));

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        console.log('❌ CORS bloqueó:', origin);
        callback(new Error('CORS no permitido'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  return { allowedOrigins, corsOptions };
};

module.exports = createCorsConfig;
