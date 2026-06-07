const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TidalWave API',
      version: '1.0.0',
      description: `
## 🌊 TidalWave - Smart Waste Management Platform

Backend API for government agencies (LAWMA), waste contractors, drivers, and citizens.

### Authentication
Most endpoints require a Bearer JWT token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Roles
- **admin** — Government dashboard, system management
- **contractor** — Manage drivers, view operations
- **driver** — Pickup routes, confirm collections
- **citizen** — Dispose waste, report issues, earn rewards

### Standard Response Shape
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { },
  "meta": { "page": 1, "total": 240 }
}
\`\`\`
      `,
      contact: { name: 'TidalWave Engineering', email: 'engineering@tidalwave.ng' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}/api/v1`, description: 'Local dev' },
      { url: 'https://api.tidalwave.ng/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // === BASE RESPONSES ===
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object', nullable: true },
            meta: { type: 'object', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            data: { type: 'object', nullable: true, example: null },
            errors: { type: 'object', nullable: true },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 240 },
          },
        },

        // === USER ===
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'contractor', 'driver', 'citizen'] },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            agency: { type: 'string', nullable: true },
            vehicle_number: { type: 'string', nullable: true },
            assigned_area: { type: 'string', nullable: true },
            email_verified: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'ibrahim@lawma.gov.ng' },
            password: { type: 'string', minLength: 8, example: 'StrongP@ss123' },
            role: { type: 'string', enum: ['admin', 'contractor', 'driver', 'citizen'], example: 'driver' },
            first_name: { type: 'string', example: 'Ibrahim' },
            last_name: { type: 'string', example: 'Adeyemi' },
            phone: { type: 'string', example: '+234 803 123 4567' },
            address: { type: 'string', example: '15 Admiralty Way, Lekki Phase 1' },
            agency: { type: 'string', example: 'Lagos State Waste Management Authority (LAWMA)' },
            vehicle_number: { type: 'string', example: 'TW-001' },
            drivers_license: { type: 'string', example: 'LAG-DL-2024-5678' },
            assigned_area: { type: 'string', example: 'Victoria Island' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@zuriflux.gov' },
            password: { type: 'string', example: 'StrongP@ss123' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
          },
        },

        // === BIN ===
        Bin: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'LK-001' },
            zone: { type: 'string', example: 'Lekki Phase 1' },
            fill_level: { type: 'integer', minimum: 0, maximum: 100, example: 35 },
            status: { type: 'string', enum: ['normal', 'warning', 'critical', 'overflow'] },
            address: { type: 'string', example: '15 Admiralty Way, Lekki Phase 1' },
            lat: { type: 'number', format: 'float', example: 6.4474 },
            lng: { type: 'number', format: 'float', example: 3.4553 },
            assigned_contractor_id: { type: 'string', format: 'uuid', nullable: true },
            last_updated: { type: 'string', format: 'date-time' },
          },
        },
        CreateBinRequest: {
          type: 'object',
          required: ['code', 'zone', 'lat', 'lng'],
          properties: {
            code: { type: 'string', example: 'LK-001' },
            zone: { type: 'string', example: 'Lekki Phase 1' },
            lat: { type: 'number', example: 6.4474 },
            lng: { type: 'number', example: 3.4553 },
            address: { type: 'string', example: '15 Admiralty Way' },
            assigned_contractor_id: { type: 'string', format: 'uuid' },
          },
        },
        TelemetryRequest: {
          type: 'object',
          required: ['bin_code', 'fill_level'],
          properties: {
            bin_code: { type: 'string', example: 'LK-001' },
            fill_level: { type: 'integer', minimum: 0, maximum: 100, example: 75 },
            battery: { type: 'integer', example: 87 },
            temperature: { type: 'number', example: 32.5 },
          },
        },

        // === ROUTE ===
        Route: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            driver_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Victoria Island Route A' },
            status: { type: 'string', enum: ['pending', 'active', 'completed', 'cancelled'] },
            scheduled_date: { type: 'string', format: 'date' },
            started_at: { type: 'string', format: 'date-time', nullable: true },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            distance_km: { type: 'number', nullable: true },
            bins: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bin_id: { type: 'string', format: 'uuid' },
                  code: { type: 'string' },
                  sequence: { type: 'integer' },
                  fill_level: { type: 'integer' },
                  status: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  picked_up_at: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        GenerateRouteRequest: {
          type: 'object',
          required: ['driver_id', 'zone'],
          properties: {
            driver_id: { type: 'string', format: 'uuid' },
            zone: { type: 'string', example: 'Victoria Island' },
            max_bins: { type: 'integer', default: 15, example: 10 },
          },
        },
        PickupRequest: {
          type: 'object',
          required: ['bin_id'],
          properties: {
            bin_id: { type: 'string', format: 'uuid' },
            notes: { type: 'string', example: 'Bin cleared, lid replaced' },
          },
        },

        // === ALERT ===
        Alert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bin_id: { type: 'string', format: 'uuid' },
            bin_code: { type: 'string' },
            type: { type: 'string', example: 'fill_threshold' },
            severity: { type: 'string', enum: ['warning', 'critical', 'overflow'] },
            message: { type: 'string' },
            resolved: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // === ISSUE ===
        Issue: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reporter_id: { type: 'string', format: 'uuid' },
            bin_id: { type: 'string', format: 'uuid', nullable: true },
            type: { type: 'string', enum: ['overflowing', 'damaged', 'missed_collection', 'illegal_dumping', 'odor', 'other'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['open', 'in_progress', 'verified', 'resolved', 'rejected'] },
            description: { type: 'string' },
            photo_url: { type: 'string', nullable: true },
            address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // === CITIZEN ===
        Disposal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            citizen_id: { type: 'string', format: 'uuid' },
            bin_id: { type: 'string', format: 'uuid' },
            waste_type: { type: 'string', enum: ['recyclable', 'organic', 'general', 'ewaste'] },
            photo_url: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            points_earned: { type: 'integer', example: 50 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreditBalance: {
          type: 'object',
          properties: {
            balance: { type: 'integer', example: 1250 },
          },
        },
        Reward: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'N500 Airtime Voucher' },
            category: { type: 'string', example: 'airtime' },
            points_required: { type: 'integer', example: 500 },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'New Reward Unlocked!' },
            body: { type: 'string' },
            type: { type: 'string' },
            data: { type: 'object' },
            read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Insufficient role',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Invalid request payload',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registration, login, password management' },
      { name: 'Bins', description: 'Smart bin CRUD & IoT telemetry' },
      { name: 'Routes', description: 'Pickup route generation & driver ops' },
      { name: 'Alerts', description: 'Threshold alerts & resolutions' },
      { name: 'Analytics', description: 'Aggregated reports & KPIs' },
      { name: 'Citizen', description: 'Disposals, rewards, illegal dumping reports' },
      { name: 'Notifications', description: 'In-app notifications' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = swaggerJsdoc(options);