const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../models/User');
const Team = require('../models/Team');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);

  const studentsWithPhone = await User.countDocuments({
    phone: { $ne: null, $exists: true },
  });
  console.log(`Students with phone set: ${studentsWithPhone}`);

  const sampleUsers = await User.find({ phone: { $ne: null } })
    .limit(5)
    .select('name rollNumber email phone phoneNumber memberType role');
  console.log('Sample updated users:');
  console.log(JSON.stringify(sampleUsers, null, 2));

  const team1 = await Team.findOne({ teamNumber: 1 })
    .populate('teamLeadId', 'name email phone phoneNumber')
    .populate('members', 'name email phone phoneNumber');
  console.log('\nTeam 1 Lead:', team1.teamLeadId);
  console.log('Team 1 First Member:', team1.members[0]);

  process.exit(0);
}

verify();
