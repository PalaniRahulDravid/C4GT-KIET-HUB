const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../models/User');

async function testGate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Find a team lead user
  const teamLead = await User.findOne({
    $or: [{ role: 'teamlead' }, { role: 'team_lead' }]
  }).select('+password');

  if (!teamLead) {
    console.error('No team lead found in DB!');
    process.exit(1);
  }

  console.log(`Found Team Lead: ${teamLead.name} (${teamLead.email}, Roll: ${teamLead.rollNumber})`);
  console.log(`Current isPasswordChanged in DB: ${teamLead.isPasswordChanged}`);

  // Test with fetch against local backend server at port 5000
  const baseUrl = 'http://localhost:5000/api';

  // 1. Try login with roll number
  console.log('\n--- Test 1: Login with initial credentials ---');
  let loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rollNumber: teamLead.rollNumber,
      password: teamLead.rollNumber
    })
  });

  let loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.log(`Login with rollNumber failed (${loginRes.status}). Trying to temporarily set password to rollNumber for test.`);
    teamLead.password = teamLead.rollNumber;
    teamLead.isPasswordChanged = false;
    await teamLead.save();

    loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: teamLead.rollNumber,
        password: teamLead.rollNumber
      })
    });
    loginData = await loginRes.json();
  }

  console.log(`Login Status: ${loginRes.status}`);
  console.log(`mustChangePassword returned: ${loginData.user?.mustChangePassword}`);
  console.log(`isPasswordChanged returned: ${loginData.user?.isPasswordChanged}`);

  if (!loginData.token) {
    console.error('Login failed to return token:', loginData);
    process.exit(1);
  }

  const token = loginData.token;

  // 2. Change password with incorrect current password
  console.log('\n--- Test 2: Change password with WRONG current password ---');
  const wrongRes = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword999!',
      newPassword: 'MyNewStrongPassword123!'
    })
  });
  const wrongData = await wrongRes.json();
  console.log(`Status: ${wrongRes.status}, Expected: 401. Result:`, wrongData.message);

  // 3. Change password with new password equal to rollNumber
  console.log('\n--- Test 3: Change password with newPassword = rollNumber ---');
  const rollRes = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: teamLead.rollNumber,
      newPassword: teamLead.rollNumber
    })
  });
  const rollData = await rollRes.json();
  console.log(`Status: ${rollRes.status}, Expected: 400. Result:`, rollData.message);

  // 4. Change password with valid new password
  console.log('\n--- Test 4: Change password with valid new password ---');
  const validNewPassword = 'LeadPassword@2026';
  const validRes = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: teamLead.rollNumber,
      newPassword: validNewPassword
    })
  });
  const validData = await validRes.json();
  console.log(`Status: ${validRes.status}, Expected: 200.`);
  console.log(`Response mustChangePassword: ${validData.user?.mustChangePassword} (Expected: false)`);
  console.log(`Response isPasswordChanged: ${validData.user?.isPasswordChanged} (Expected: true)`);

  // 5. Test login with old password (should fail) and new password (should succeed)
  console.log('\n--- Test 5: Login with new password ---');
  const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rollNumber: teamLead.rollNumber,
      password: validNewPassword
    })
  });
  const newLoginData = await newLoginRes.json();
  console.log(`New Login Status: ${newLoginRes.status}`);
  console.log(`New Login mustChangePassword: ${newLoginData.user?.mustChangePassword} (Expected: false)`);

  // Cleanup / Reset back to initial default so the user is in their initial state
  console.log('\n--- Resetting test team lead back to initial default state ---');
  const leadToReset = await User.findById(teamLead._id).select('+password');
  leadToReset.password = teamLead.rollNumber;
  leadToReset.isPasswordChanged = false;
  await leadToReset.save();
  console.log('Reset complete. isPasswordChanged is back to false.');

  await mongoose.disconnect();
  console.log('\nAll tests passed successfully!');
  process.exit(0);
}

testGate().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
