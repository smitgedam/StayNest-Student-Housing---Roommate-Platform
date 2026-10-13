import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth';
import { usersRouter } from './server/routes/users';
import { propertiesRouter } from './server/routes/properties';
import { messRouter } from './server/routes/mess';
import { bookingsRouter } from './server/routes/bookings';
import { reviewsRouter } from './server/routes/reviews';
import { chatRouter } from './server/routes/chat';
import { adminRouter } from './server/routes/admin';
import { reportsRouter } from './server/routes/reports';
import { maintenanceRouter } from './server/routes/maintenance';
import { expensesRouter } from './server/routes/expenses';
import { safetyRouter } from './server/routes/safety';
import { geocodeRouter } from './server/routes/geocode';
import { setupSocketIO } from './server/socket';
import { db } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  const socketHandlers = setupSocketIO(io);

  // Attach socket notifier to app locals for route handlers if needed
  app.locals.socketHandlers = socketHandlers;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/properties', propertiesRouter);
  app.use('/api/mess', messRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/maintenance', maintenanceRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/safety', safetyRouter);
  app.use('/api/geocode', geocodeRouter);

  // Health and demo reset endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.post('/api/reset-demo', (_req, res) => {
    db.resetToDefault();
    res.json({ message: 'Demo database reset to initial seeds' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`StayNest full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
