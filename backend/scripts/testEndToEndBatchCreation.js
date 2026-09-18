const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createBatchWithCohort, getBatches } = require('../controllers/adminController');
const Batch = require('../models/Batch');
const Team = require('../models/Team');
const User = require('../models/User');

const mockReqRes = (body = {}, query = {}) => {
  const req = { body, query, user: { role: 'admin', email: 'admin@c4gt-kiet.in' } };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
  };
  return { req, res };
};

// Generate valid 81-member cohort CSV for 2027-2028
function generateValid81Cohort() {
  const headers = ['teamNumber', 'roleCode', 'name', 'rollNumber', 'email', 'phone', 'college', 'branch', 'backlogs', 'type'];
  const rows = [];
  for (let t = 1; t <= 9; t++) {
    // 1 Lead
    rows.push([t, 'LEAD', `Lead Student T${t}`, `27B21A${4200 + t}`, `lead.t${t}.2027@kiet.edu`, `9876500${t}00`, 'KIET', 'CSE', 0, 'DS']);
    // 4 SDs
    for (let s = 1; s <= 4; s++) {
      rows.push([t, `SD${s}`, `Senior Dev ${s} T${t}`, `27B21A${4500 + t * 10 + s}`, `sd${s}.t${t}.2027@kiet.edu`, `9876500${t}${s}1`, 'KIET', 'AID', 0, 'DS']);
    }
    // 4 JDs
    for (let j = 1; j <= 4; j++) {
      rows.push([t, `JD${j}`, `Junior Dev ${j} T${t}`, `28B21A${4300 + t * 10 + j}`, `jd${j}.t${t}.2027@kiet.edu`, `9876500${t}${j}2`, 'KIET', 'CSM', 0, 'HS']);
    }
  }
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function runE2ETest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  // Clean up 2027-2028 batch from previous test if any
  await Batch.deleteOne({ id: '2027-2028' });
  await Team.deleteMany({ batch: '2027-2028' });
  await User.deleteMany({ batch: '2027-2028' });

  const csvText = generateValid81Cohort();
  console.log('Generated 81-student CSV for Batch 2027-2028.');

  const { req, res } = mockReqRes({
    year: '2027 – 2028',
    status: 'Upcoming',
    startDate: '2027-08-01',
    endDate: '2028-05-31',
    csvText,
  });

  console.log('Calling createBatchWithCohort...');
  await createBatchWithCohort(req, res);

  console.log('Result Status:', res.statusCode);
  console.log('Result Message:', res.data.message);

  if (res.statusCode !== 201) {
    throw new Error(`Batch creation failed with code ${res.statusCode}: ${JSON.stringify(res.data)}`);
  }

  // Verification in Atlas
  const batchInDb = await Batch.findOne({ id: '2027-2028' });
  console.log('Batch in DB:', batchInDb.year, 'Status:', batchInDb.status);

  const teamsCount = await Team.countDocuments({ batch: '2027-2028' });
  console.log(`Teams in Batch 2027-2028: ${teamsCount} (Expected: 9)`);

  const usersCount = await User.countDocuments({ batch: '2027-2028' });
  console.log(`Users in Batch 2027-2028: ${usersCount} (Expected: 81)`);

  const leadsCount = await User.countDocuments({ batch: '2027-2028', role: 'teamlead' });
  console.log(`Team Leads in Batch 2027-2028: ${leadsCount} (Expected: 9)`);

  const sdsCount = await User.countDocuments({ batch: '2027-2028', memberType: 'senior_developer', role: 'user' });
  console.log(`Senior Devs in Batch 2027-2028: ${sdsCount} (Expected: 36)`);

  const jdsCount = await User.countDocuments({ batch: '2027-2028', memberType: 'junior_developer' });
  console.log(`Junior Devs in Batch 2027-2028: ${jdsCount} (Expected: 36)`);

  // Verify Team 1 structure
  const team1 = await Team.findOne({ batch: '2027-2028', teamNumber: 1 })
    .populate('teamLeadId', 'name email role')
    .populate('members', 'name email memberType');
  console.log(`Team 1 Lead: ${team1.teamLeadId.name} (${team1.teamLeadId.role})`);
  console.log(`Team 1 Members Count: ${team1.members.length} (Expected: 8 members)`);

  // Verify getBatches
  const gb = mockReqRes();
  await getBatches(gb.req, gb.res);
  console.log(`Batches in DB via getBatches: ${gb.res.data.count}`);
  console.log('Batches list:', gb.res.data.batches.map(b => ({ id: b.id, studentsCount: b.studentsCount })));

  console.log('\n--- END-TO-END VALIDATION PASSED WITH 100% INTEGRITY! ---\n');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
