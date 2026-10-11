import express, { type Application } from 'express';
import './types/express.d.ts';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { schoolRouter } from './routes/school.routes.js';
import { sendSuccess } from './utils/response.js';

export const app: Application = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration for Web and Mobile
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform'],
  })
);

// 3. Body Parsing with Payload Size Limits (prevents Large-Payload DoS)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// 4. Cookie Parsing (enables secure HttpOnly cookie reading)
app.use(cookieParser());

// 5. Global API Rate Limiting
app.use('/api', apiLimiter);

// 6. Root & Health Check Endpoints
app.get('/', (_req, res) => {
  sendSuccess(res, { status: 'ONLINE', portal: 'School Management System', version: '1.0.0' }, 'Academic Portal API');
});

app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    portal: 'School Management System',
  });
});

// 7. Mount Core API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/school', schoolRouter);

// 8. 404 & Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);
