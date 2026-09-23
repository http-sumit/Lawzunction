import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import LawyerProfile from '../src/models/LawyerProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  let email = null;
  const emailIndex = args.indexOf('--email');
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    email = args[emailIndex + 1].trim().toLowerCase();
  } else {
    // Look for first non-flag arg as email fallback
    const nonFlag = args.find(a => !a.startsWith('--'));
    if (nonFlag) email = nonFlag.trim().toLowerCase();
  }

  if (!email) {
    console.error('❌ Error: Email is required.');
    console.error('Usage: node scripts/make-admin-lawyer.js --email <email> [--dry-run]');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` 🛡️  Lawzunction: Assign ADMIN Role to Lawyer Account `);
  console.log(` Mode: ${isDryRun ? 'DRY RUN (no database writes)' : 'LIVE EXECUTION'}`);
  console.log(` Target Email: ${email}`);
  console.log(`======================================================\n`);

  try {
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB.\n');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User with email "${email}" not found in database.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    if (!lawyerProfile) {
      console.warn(`⚠️ Warning: No LawyerProfile found linked to user ID ${user._id}.`);
    } else {
      console.log(` Verified linked LawyerProfile found (ID: ${lawyerProfile._id}, Slug: ${lawyerProfile.slug || 'none'}, Status: ${lawyerProfile.profileStatus}).`);
    }

    console.log('\n--- BEFORE VALUES ---');
    console.log(`User ID:             ${user._id}`);
    console.log(`User Name:           ${user.name}`);
    console.log(`User Email:          ${user.email}`);
    console.log(`User Role:           ${user.role}`);
    console.log(`User.lawyerProfile:  ${user.lawyerProfile || '(not set / schema-independent)'}`);

    const targetRole = 'ADMIN';
    const targetProfileId = lawyerProfile ? lawyerProfile._id : null;

    console.log('\n--- TARGET AFTER VALUES ---');
    console.log(`User Role:           ${targetRole}`);
    console.log(`User.lawyerProfile:  ${targetProfileId || '(none)'}`);

    if (user.role === targetRole) {
      console.log(`\n Account already has role "${targetRole}". Idempotent check passed: No changes needed.`);
    }

    if (isDryRun) {
      console.log('\n🔍 [DRY RUN]: Simulation complete. No changes were saved to the database.');
    } else {
      user.role = targetRole;
      if (targetProfileId && user.schema && user.schema.path('lawyerProfile')) {
        user.lawyerProfile = targetProfileId;
      }
      await user.save();
      console.log('\n Success: User updated in database.');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.\n');
  } catch (error) {
    console.error('❌ Execution error:', error.message || error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

run();
