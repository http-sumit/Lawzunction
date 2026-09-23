import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { migrateExistingLawyers } from '../config/migration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const run = async () => {
  console.log('🔄 Running Lawzunction Lawyer Profile Migration Script...');
  try {
    await connectDB();
    const result = await migrateExistingLawyers();
    console.log('📊 Migration Result:');
    console.log(JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    console.log('🏁 Migration script completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

run();
