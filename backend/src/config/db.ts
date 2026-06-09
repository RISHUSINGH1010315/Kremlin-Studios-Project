import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'kremlin_studios',
    });

export const initDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');
    
    // Try multiple paths to find schema.sql (development, compiled production, and fallback)
    let schemaSql = '';
    const pathsToTry = [
      path.join(__dirname, '../db/schema.sql'),
      path.join(__dirname, '../../src/db/schema.sql'),
      path.join(process.cwd(), 'src/db/schema.sql'),
      path.join(process.cwd(), 'backend/src/db/schema.sql'),
      path.join(process.cwd(), 'dist/db/schema.sql')
    ];

    let found = false;
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        try {
          schemaSql = fs.readFileSync(p, 'utf8');
          found = true;
          console.log(`Found database schema file at: ${p}`);
          break;
        } catch (readErr) {
          console.warn(`Attempted to read schema from ${p} but failed:`, readErr);
        }
      }
    }

    if (found) {
      await client.query(schemaSql);
      console.log('Database tables verified/created successfully from file schema.');
    } else {
      console.warn('schema.sql not found in standard paths. Using inlined schema fallback.');
      const fallbackSchema = `
        -- Schema Fallback for Kremlin Luxury Studios
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'admin',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inquiries (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            check_in_date DATE,
            check_out_date DATE,
            guests INTEGER DEFAULT 1,
            message TEXT,
            status VARCHAR(50) DEFAULT 'new',
            source VARCHAR(100) DEFAULT 'contact_form',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(100) UNIQUE NOT NULL,
            guest_name VARCHAR(255),
            guest_email VARCHAR(255),
            messages JSONB DEFAULT '[]'::jsonb,
            qualified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS analytics_events (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            page_path VARCHAR(255) DEFAULT '/',
            referrer VARCHAR(255),
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(fallbackSchema);
      console.log('Database tables verified/created successfully using fallback inline schema.');
    }
    
    // Seed default admin user if no users exist
    const userCountResult = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    
    if (userCount === 0) {
      const defaultEmail = 'admin@kremlinstudios.com';
      const defaultPassword = 'admin';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        [defaultEmail, hashedPassword, 'admin']
      );
      console.log('Default admin user seeded successfully:');
      console.log(`Email: ${defaultEmail}`);
      console.log(`Password: ${defaultPassword}`);
    }
    
    client.release();
  } catch (error) {
    console.error('Error connecting to database or initializing tables:', error);
  }
};

export default pool;
