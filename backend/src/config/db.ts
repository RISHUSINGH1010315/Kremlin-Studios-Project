import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
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
    
    // Read schema.sql and execute it
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('Database tables verified/created successfully.');
    } else {
      console.warn('schema.sql not found at:', schemaPath);
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
