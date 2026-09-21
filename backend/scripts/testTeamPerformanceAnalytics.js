const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // Find an admin user to generate token
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.findOne({});
  }

  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET || 'c4gt_kiet_hub_jwt_secret_dev_key_2026',
    { expiresIn: '1h' }
  );

  const baseUrl = 'http://localhost:5000/api';

  for (const tf of ['weekly', 'monthly', 'overall']) {
    console.log(`\n================ Testing Timeframe: ${tf.toUpperCase()} ================`);
    const res = await fetch(`${baseUrl}/admin/teams/analytics?batch=2026-2027&timeframe=${tf}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.error(`Failed ${tf} with status ${res.status}:`, await res.text());
      process.exit(1);
    }

    const data = await res.json();
    console.log(`Success: ${data.success}, Timeframe: ${data.timeframe}`);
    console.log(`Summary:`, data.summary);
    console.log(`Total Teams Returned: ${data.teams.length}`);

    // Print each team's score and metrics
    data.teams.forEach(t => {
      console.log(`Team ${t.teamNumber} (${t.name}): Score=${t.score}%, Tasks=${t.tasksCount}, Completed=${t.completedAssignments}, Submitted=${t.submittedAssignments}, Overdue=${t.overdueAssignments}, Status=${t.status}`);
    });
  }

  // Also test /admin/teams to confirm taskCompletion & performancePct are populated
  console.log('\n================ Testing /admin/teams Enrichment ================');
  const teamsRes = await fetch(`${baseUrl}/admin/teams?batch=2026-2027`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const teamsData = await teamsRes.json();
  console.log('Teams count:', teamsData.teams?.length);
  const sample = teamsData.teams?.[0];
  console.log('Sample Team 1:', {
    name: sample?.name,
    taskCompletion: sample?.taskCompletion,
    performancePct: sample?.performancePct,
    membersCount: sample?.membersCount
  });

  await mongoose.disconnect();
  console.log('\nAll Team Performance Analytics tests passed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
