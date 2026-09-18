const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Team = require('../models/Team');

async function migrate() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI not found in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully.');

    // 1. Update all users to batch: '2026-2027'
    const totalUsers = await User.countDocuments();
    console.log(`Found ${totalUsers} total users in the database.`);

    const userUpdateResult = await User.updateMany(
      {},
      { $set: { batch: '2026-2027' } }
    );
    console.log(`Updated users batch to '2026-2027': Matched ${userUpdateResult.matchedCount}, Modified ${userUpdateResult.modifiedCount}`);

    // 2. Update all teams to batch: '2026-2027'
    const totalTeams = await Team.countDocuments();
    console.log(`Found ${totalTeams} total teams in the database.`);

    const teamUpdateResult = await Team.updateMany(
      {},
      { $set: { batch: '2026-2027' } }
    );
    console.log(`Updated teams batch to '2026-2027': Matched ${teamUpdateResult.matchedCount}, Modified ${teamUpdateResult.modifiedCount}`);

    // 3. Verification
    const usersWithoutBatch = await User.countDocuments({
      $or: [{ batch: { $exists: false } }, { batch: null }, { batch: '' }],
    });
    const usersWithBatch2026 = await User.countDocuments({ batch: '2026-2027' });

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Total users in DB: ${totalUsers}`);
    console.log(`Users with batch '2026-2027': ${usersWithBatch2026}`);
    console.log(`Users missing batch: ${usersWithoutBatch}`);

    const sampleUsers = await User.find()
      .limit(5)
      .select('name rollNumber email role batch memberType');
    console.log('\nSample verified users:');
    console.log(JSON.stringify(sampleUsers, null, 2));

    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

migrate();
