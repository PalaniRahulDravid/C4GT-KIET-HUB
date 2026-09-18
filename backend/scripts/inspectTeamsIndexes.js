const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.db.collection('teams');
  const indexes = await coll.indexes();
  console.log('Indexes on teams collection:');
  indexes.forEach((idx) => console.log(JSON.stringify(idx)));

  for (const idx of indexes) {
    if (idx.name === 'name_1' || (idx.key && idx.key.name && !idx.key.batch)) {
      console.log('Dropping index:', idx.name);
      await coll.dropIndex(idx.name);
    }
    if (idx.name === 'teamNumber_1' || (idx.key && idx.key.teamNumber && !idx.key.batch)) {
      console.log('Dropping index:', idx.name);
      await coll.dropIndex(idx.name);
    }
  }

  const remaining = await coll.indexes();
  console.log('Remaining indexes on teams:');
  remaining.forEach((idx) => console.log(JSON.stringify(idx)));
  process.exit(0);
}

check();
