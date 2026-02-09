import express from 'express';
import cors from 'cors';
import { getDb, initializeDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import summaryRouter from './routes/summary';
import driversRouter from './routes/drivers';
import riskFactorsRouter from './routes/risk-factors';
import recommendationsRouter from './routes/recommendations';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and seed data
console.log('🚀 Initializing Revenue Intelligence Backend...');
(async () => {
  try {
    await initializeDatabase();

    const db = await getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM accounts');
    const accountCount = stmt.step() ? (stmt.getAsObject() as { count: number }) : { count: 0 };
    stmt.free();

    if (accountCount.count === 0) {
      console.log('📦 Database is empty, seeding data...');
      await seedDatabase();
    } else {
      console.log(`✅ Database already contains data (${accountCount.count} accounts)`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
})();

// API Routes
app.use('/api/summary', summaryRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/risk-factors', riskFactorsRouter);
app.use('/api/recommendations', recommendationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   - GET http://localhost:${PORT}/api/summary`);
  console.log(`   - GET http://localhost:${PORT}/api/drivers`);
  console.log(`   - GET http://localhost:${PORT}/api/risk-factors`);
  console.log(`   - GET http://localhost:${PORT}/api/recommendations`);
  console.log(`\n💡 Ready for frontend connections!\n`);
});

export default app;
