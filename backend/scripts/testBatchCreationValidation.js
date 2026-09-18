const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { getBatches, createBatchWithCohort } = require('../controllers/adminController');
const Batch = require('../models/Batch');

// Helper mock res/req
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

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas for test...');

  // Test 1: getBatches
  console.log('\n[Test 1] Testing getBatches...');
  const t1 = mockReqRes();
  await getBatches(t1.req, t1.res);
  console.log(`Status: ${t1.res.statusCode}, Found batches: ${t1.res.data.count}`);
  if (t1.res.statusCode !== 200 || t1.res.data.count < 1) {
    throw new Error('Test 1 failed: Expected at least 1 batch');
  }

  // Test 2: Create batch without cohort data
  console.log('\n[Test 2] Testing createBatch without cohort data (Should return 400)...');
  const t2 = mockReqRes({ year: '2028 – 2029' });
  await createBatchWithCohort(t2.req, t2.res);
  console.log(`Status: ${t2.res.statusCode}, Message: ${t2.res.data.message}`);
  if (t2.res.statusCode !== 400) {
    throw new Error('Test 2 failed: Expected 400 without cohort data');
  }

  // Test 3: CSV with missing headers
  console.log('\n[Test 3] Testing CSV with missing headers (Should return 400)...');
  const t3 = mockReqRes({
    year: '2028 – 2029',
    csvText: 'foo,bar,baz\n1,2,3',
  });
  await createBatchWithCohort(t3.req, t3.res);
  console.log(`Status: ${t3.res.statusCode}, Errors:`, t3.res.data.errors);
  if (t3.res.statusCode !== 400 || !t3.res.data.errors[0].includes('Missing required CSV header')) {
    throw new Error('Test 3 failed: Expected missing header error');
  }

  // Test 4: CSV with only 1 team and missing leads
  console.log('\n[Test 4] Testing CSV with insufficient teams & wrong quotas (Should return 400)...');
  const invalidCsv = [
    'teamNumber,roleCode,name,rollNumber,email,phone,college,branch,backlogs,type',
    '1,SD,Alice,23B21A0001,alice@kiet.edu,9999999999,KIET,CSE,0,DS',
  ].join('\n');
  const t4 = mockReqRes({
    year: '2028 – 2029',
    csvText: invalidCsv,
  });
  await createBatchWithCohort(t4.req, t4.res);
  console.log(`Status: ${t4.res.statusCode}, Errors count: ${t4.res.data.errors.length}`);
  console.log('Sample errors:', t4.res.data.errors.slice(0, 4));
  if (t4.res.statusCode !== 400) {
    throw new Error('Test 4 failed: Expected 400 for incomplete cohort data');
  }

  console.log('\nALL 4 BACKEND VALIDATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
