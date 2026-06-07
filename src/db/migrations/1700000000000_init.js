exports.up = (pgm) => {
  pgm.createExtension('postgis', { ifNotExists: true });
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // USERS
  pgm.createType('user_role', ['admin', 'contractor', 'driver', 'citizen']);
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'user_role', notNull: true },
    first_name: 'varchar(100)',
    last_name: 'varchar(100)',
    phone: 'varchar(30)',
    address: 'text',
    profile_photo_url: 'text',
    agency: 'varchar(255)',
    vehicle_number: 'varchar(50)',
    drivers_license: 'varchar(100)',
    assigned_area: 'varchar(255)',
    email_verified: { type: 'boolean', default: false },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('refresh_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    token_hash: { type: 'varchar(255)', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    revoked: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('password_resets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    token_hash: 'varchar(255)',
    expires_at: 'timestamptz',
    used: { type: 'boolean', default: false },
  });

  // BINS
  pgm.createType('bin_status', ['normal', 'warning', 'critical', 'overflow']);
  pgm.createTable('bins', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    code: { type: 'varchar(50)', unique: true, notNull: true }, // e.g. LK-001
    zone: { type: 'varchar(100)', notNull: true },
    location: { type: 'geography(Point,4326)', notNull: true },
    address: 'text',
    fill_level: { type: 'integer', default: 0 },
    status: { type: 'bin_status', default: 'normal' },
    assigned_contractor_id: { type: 'uuid', references: 'users(id)' },
    last_updated: { type: 'timestamptz', default: pgm.func('now()') },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
  pgm.createIndex('bins', 'location', { method: 'gist' });
  pgm.createIndex('bins', 'status');

  pgm.createTable('bin_telemetry', {
    id: { type: 'bigserial', primaryKey: true },
    bin_id: { type: 'uuid', notNull: true, references: 'bins(id)', onDelete: 'cascade' },
    fill_level: { type: 'integer', notNull: true },
    battery: 'integer',
    temperature: 'numeric(5,2)',
    recorded_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
  pgm.createIndex('bin_telemetry', ['bin_id', 'recorded_at']);

  // ROUTES
  pgm.createType('route_status', ['pending', 'active', 'completed', 'cancelled']);
  pgm.createTable('routes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    driver_id: { type: 'uuid', references: 'users(id)' },
    name: 'varchar(255)',
    status: { type: 'route_status', default: 'pending' },
    scheduled_date: 'date',
    started_at: 'timestamptz',
    completed_at: 'timestamptz',
    distance_km: 'numeric(8,2)',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('route_bins', {
    id: { type: 'bigserial', primaryKey: true },
    route_id: { type: 'uuid', notNull: true, references: 'routes(id)', onDelete: 'cascade' },
    bin_id: { type: 'uuid', notNull: true, references: 'bins(id)' },
    sequence: { type: 'integer', notNull: true },
    picked_up_at: 'timestamptz',
    notes: 'text',
  });
  pgm.createIndex('route_bins', ['route_id', 'sequence']);

  // ISSUES
  pgm.createType('issue_type', ['overflowing', 'damaged', 'missed_collection', 'illegal_dumping', 'odor', 'other']);
  pgm.createType('issue_severity', ['low', 'medium', 'high', 'critical']);
  pgm.createType('issue_status', ['open', 'in_progress', 'verified', 'resolved', 'rejected']);
  pgm.createTable('issues', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    reporter_id: { type: 'uuid', references: 'users(id)' },
    bin_id: { type: 'uuid', references: 'bins(id)' },
    type: { type: 'issue_type', notNull: true },
    severity: { type: 'issue_severity', default: 'medium' },
    status: { type: 'issue_status', default: 'open' },
    description: { type: 'text', notNull: true },
    photo_url: 'text',
    location: 'geography(Point,4326)',
    address: 'text',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
    resolved_at: 'timestamptz',
  });

  // ALERTS
  pgm.createTable('alerts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    bin_id: { type: 'uuid', references: 'bins(id)', onDelete: 'cascade' },
    type: { type: 'varchar(50)', notNull: true },
    severity: { type: 'varchar(20)', notNull: true },
    message: 'text',
    resolved: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('notifications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'cascade' },
    title: 'varchar(255)',
    body: 'text',
    type: 'varchar(50)',
    data: 'jsonb',
    read: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('device_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'cascade' },
    token: { type: 'text', notNull: true },
    platform: 'varchar(20)',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  // CITIZEN REWARDS
  pgm.createTable('citizen_credits', {
    id: { type: 'bigserial', primaryKey: true },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'cascade' },
    points: { type: 'integer', notNull: true },
    reason: 'varchar(100)',
    reference_id: 'uuid',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('disposals', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    citizen_id: { type: 'uuid', references: 'users(id)' },
    bin_id: { type: 'uuid', references: 'bins(id)' },
    waste_type: 'varchar(50)',
    photo_url: 'text',
    notes: 'text',
    points_earned: 'integer',
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });

  pgm.createTable('rewards_catalog', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    category: 'varchar(50)',
    points_required: { type: 'integer', notNull: true },
    description: 'text',
    is_active: { type: 'boolean', default: true },
  });

  pgm.createTable('reward_claims', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)' },
    reward_id: { type: 'uuid', references: 'rewards_catalog(id)' },
    points_spent: 'integer',
    status: { type: 'varchar(20)', default: 'pending' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('reward_claims');
  pgm.dropTable('rewards_catalog');
  pgm.dropTable('disposals');
  pgm.dropTable('citizen_credits');
  pgm.dropTable('device_tokens');
  pgm.dropTable('notifications');
  pgm.dropTable('alerts');
  pgm.dropTable('issues');
  pgm.dropType('issue_status');
  pgm.dropType('issue_severity');
  pgm.dropType('issue_type');
  pgm.dropTable('route_bins');
  pgm.dropTable('routes');
  pgm.dropType('route_status');
  pgm.dropTable('bin_telemetry');
  pgm.dropTable('bins');
  pgm.dropType('bin_status');
  pgm.dropTable('password_resets');
  pgm.dropTable('refresh_tokens');
  pgm.dropTable('users');
  pgm.dropType('user_role');
};