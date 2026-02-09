import fs from 'fs';
import path from 'path';
import { getDb, initializeDatabase, saveDbToFile } from './database';

interface Account {
  account_id: string;
  name: string;
  industry: string;
  segment: string;
}

interface Rep {
  rep_id: string;
  name: string;
}

interface Deal {
  deal_id: string;
  account_id: string;
  rep_id: string;
  stage: string;
  amount: number | null;
  created_at: string;
  closed_at: string | null;
}

interface Activity {
  activity_id: string;
  deal_id: string;
  type: string;
  timestamp: string;
}

interface Target {
  month: string;
  target: number;
}

function loadJsonFile<T>(filename: string): T[] {
  const filePath = path.join(__dirname, '../../../data', filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // Initialize schema
  await initializeDatabase();

  const db = await getDb();

  // Clear existing data
  db.exec('DELETE FROM activities;');
  db.exec('DELETE FROM deals;');
  db.exec('DELETE FROM targets;');
  db.exec('DELETE FROM reps;');
  db.exec('DELETE FROM accounts;');

  // Load JSON files
  const accounts = loadJsonFile<Account>('accounts.json');
  const reps = loadJsonFile<Rep>('reps.json');
  const deals = loadJsonFile<Deal>('deals.json');
  const activities = loadJsonFile<Activity>('activities.json');
  const targets = loadJsonFile<Target>('targets.json');

  console.log(`📊 Loaded data files:`);
  console.log(`   - Accounts: ${accounts.length}`);
  console.log(`   - Reps: ${reps.length}`);
  console.log(`   - Deals: ${deals.length}`);
  console.log(`   - Activities: ${activities.length}`);
  console.log(`   - Targets: ${targets.length}`);

  // Insert accounts
  const insertAccount = db.prepare(
    'INSERT INTO accounts (account_id, name, industry, segment) VALUES (?, ?, ?, ?)'
  );
  for (const account of accounts) {
    insertAccount.run([account.account_id, account.name, account.industry, account.segment]);
  }
  insertAccount.free();

  // Insert reps
  const insertRep = db.prepare('INSERT INTO reps (rep_id, name) VALUES (?, ?)');
  for (const rep of reps) {
    insertRep.run([rep.rep_id, rep.name]);
  }
  insertRep.free();

  // Insert deals and track data quality issues
  const insertDeal = db.prepare(
    'INSERT INTO deals (deal_id, account_id, rep_id, stage, amount, created_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  let nullAmountCount = 0;
  let closedWonNullAmount = 0;
  let inconsistentClosedAt = 0;

  for (const deal of deals) {
    insertDeal.run([
      deal.deal_id,
      deal.account_id,
      deal.rep_id,
      deal.stage,
      deal.amount,
      deal.created_at,
      deal.closed_at
    ]);

    // Track data quality issues
    if (deal.amount === null) {
      nullAmountCount++;
      if (deal.stage === 'Closed Won') {
        closedWonNullAmount++;
      }
    }

    if (
      (deal.stage === 'Closed Won' || deal.stage === 'Closed Lost') &&
      deal.closed_at === null
    ) {
      inconsistentClosedAt++;
    }
  }
  insertDeal.free();

  // Insert activities
  const insertActivity = db.prepare(
    'INSERT INTO activities (activity_id, deal_id, type, timestamp) VALUES (?, ?, ?, ?)'
  );
  for (const activity of activities) {
    insertActivity.run([activity.activity_id, activity.deal_id, activity.type, activity.timestamp]);
  }
  insertActivity.free();

  // Insert targets
  const insertTarget = db.prepare('INSERT INTO targets (month, target) VALUES (?, ?)');
  for (const target of targets) {
    insertTarget.run([target.month, target.target]);
  }
  insertTarget.free();

  // Log data quality warnings
  console.log('\n⚠️  Data Quality Issues:');
  console.log(`   - Deals with null amounts: ${nullAmountCount} (${((nullAmountCount / deals.length) * 100).toFixed(1)}%)`);
  console.log(`   - Closed Won deals with null amounts: ${closedWonNullAmount}`);
  console.log(`   - Closed deals without closed_at date: ${inconsistentClosedAt}`);
  console.log(`   - Deals without activities: ${deals.length - new Set(activities.map(a => a.deal_id)).size}`);

  console.log('\n✅ Database seeded successfully!');

  await saveDbToFile();
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
}

export { seedDatabase };
