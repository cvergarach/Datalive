import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import documentsRoutes from './routes/documents.js';
import apisRoutes from './routes/apis.js';
import dataRoutes from './routes/data.js';
import insightsRoutes from './routes/insights.js';
import dashboardsRoutes from './routes/dashboards.js';
import reportsRoutes from './routes/reports.js';
import integrationsRoutes from './routes/integrations.js';
import webhooksRoutes from './routes/webhooks.js';
import statsRoutes from './routes/stats.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://datalive-six.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // Fallback for dev, ideally should be stricter in prod
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects/:projectId/documents', documentsRoutes);
app.use('/api/projects/:projectId/apis', apisRoutes);
app.use('/api/projects/:projectId/data', dataRoutes);
app.use('/api/projects/:projectId/insights', insightsRoutes);
app.use('/api/projects/:projectId/dashboards', dashboardsRoutes);
app.use('/api/projects/:projectId/reports', reportsRoutes);
app.use('/api/projects/:projectId/integrations', integrationsRoutes);
app.use('/api/projects/:projectId/chats', chatRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/stats', statsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 DataLive Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

