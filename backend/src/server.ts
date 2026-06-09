import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import apiRouter from './routes/api';
import { initDb } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Helmet for XSS and HTTP headers security
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*', // For development purposes. Can be narrowed down in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Main API Router
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start DB and Express Server
const startServer = async () => {
  console.log('Initializing database setup...');
  await initDb();
  
  app.listen(PORT, () => {
    console.log(`Kremlin Backend listening on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Error starting Kremlin backend server:', error);
});
