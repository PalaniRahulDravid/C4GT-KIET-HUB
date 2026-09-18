const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.db.collection('batches');

  try {
    await coll.dropIndex('batchId_1');
    console.log('Successfully dropped old batchId_1 index.');
  } catch (err) {
    console.log('dropIndex note:', err.message);
  }

  await coll.updateMany(
    {},
    {
      $set: {
        id: '2026-2027',
        batchId: '2026-2027',
        year: '2026 – 2027',
        name: '2026 – 2027',
        status: 'Active Batch',
        teamsCount: 9,
        activeTeamsCount: 9,
        studentsCount: 81,
        avgPerformance: '78%',
        upcoming: false,
      },
    }
  );

  const docs = await coll.find().toArray();
  console.log('Batches documents in DB:', JSON.stringify(docs, null, 2));
  process.exit(0);
}

fix();
