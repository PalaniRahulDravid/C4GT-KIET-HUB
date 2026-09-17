const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  require('../models/User');
  const User = require('../models/User');
  const user = await User.findOne({ email: 'swamyrayudu7288@gmail.com' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  console.log('Fetching tasks for Swamy from http://localhost:5000/api/student/tasks...');
  const res = await fetch('http://localhost:5000/api/student/tasks', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Response success:', data.success);
  console.log('Tasks count:', data.tasks?.length);
  if (data.tasks) {
    data.tasks.forEach(t => {
      console.log('  Task:', t.title, '| source:', t.source, '| status:', t.status, '| createdBy:', t.createdBy);
    });
  }

  // Also test for Rahul (teamlead)
  const rahul = await User.findOne({ email: 'rahuldravidpalani2005@gmail.com' });
  const rahulToken = jwt.sign(
    { id: rahul._id, role: rahul.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );
  console.log('\nFetching tasks for Rahul (teamlead) from http://localhost:5000/api/student/tasks...');
  const resRahul = await fetch('http://localhost:5000/api/student/tasks', {
    headers: {
      Authorization: `Bearer ${rahulToken}`,
      'Content-Type': 'application/json',
    },
  });
  const dataRahul = await resRahul.json();
  console.log('Rahul HTTP Status:', resRahul.status);
  console.log('Rahul Tasks count:', dataRahul.tasks?.length);
  if (dataRahul.tasks) {
    dataRahul.tasks.forEach(t => {
      console.log('  Rahul Task:', t.title, '| source:', t.source, '| status:', t.status, '| createdBy:', t.createdBy);
    });
  }

  await mongoose.disconnect();
}
run().catch(console.error);
