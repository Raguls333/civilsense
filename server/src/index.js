import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedInitialData } from './seeds/seedData.js';
import { realDb } from './db/realDb.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dprRoutes from './routes/dprRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import costRoutes from './routes/costRoutes.js';
import pettyCashRoutes from './routes/pettyCashRoutes.js';
import raBillRoutes from './routes/raBillRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CivilSense Construction OS API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/ra-bills', raBillRoutes);
app.use('/api/notifications', notificationRoutes);

// Database initialization
const initDatabase = async () => {
  await realDb.init();

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB at:', mongoUri);
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully.');
    } catch (err) {
      console.warn('MongoDB connection fallback to Real SQLite database:', err.message);
    }
  } else {
    console.log('⚡ Running with Real SQLite Persistent Database (ACID, relational tables, indexes).');
  }

  // Auto-seed if users collection is empty
  const usersCount = await realDb.getCollection('users').countDocuments();
  if (usersCount === 0) {
    await seedInitialData();
  } else {
    console.log(`⚡ Real SQLite Database active (${usersCount} users loaded).`);
  }
};

app.listen(PORT, async () => {
  await initDatabase();
  console.log(`CivilSense Server running on http://localhost:${PORT}`);
});
