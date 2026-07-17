const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || '';
const needsSsl = process.env.NODE_ENV === 'production' || 
                 dbUrl.includes('render.com') ||
                 dbUrl.includes('supabase.com') ||  
                 dbUrl.includes('supabase.co') ||
                 dbUrl.includes('neon.tech') ||
                 dbUrl.includes('amazonaws.com') ||
                 dbUrl.includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Postgres pool error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};