const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet({ contentSecurityPolicy: false })); // allow swagger UI
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',');
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/health', (_, res) => res.json({ success: true, message: 'OK' }));

// 📚 Swagger Docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'TidalWave API Docs',
  customCss: `
    .topbar { display: none; }
    .swagger-ui .info .title { color: #10b981; }
  `,
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/docs.json', (_, res) => res.json(swaggerSpec));

// API routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/bins', require('./modules/bins/bins.routes'));
app.use('/api/v1/routes', require('./modules/routes/routes.routes'));
app.use('/api/v1/alerts', require('./modules/alerts/alerts.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/citizen', require('./modules/citizen/citizen.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/notifications.routes'));

app.use((req, res) => res.status(404).json({
  success: false, message: 'Route not found', data: null, errors: null,
}));
app.use(errorHandler);

module.exports = app;