const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Team = require('../models/Team');
const User = require('../models/User');
const TeamRequest = require('../models/TeamRequest');
const Notification = require('../models/Notification');

const rawCohortData = [
  // Team 1
  { teamNum: 1, roleCode: 'LEAD', name: 'Bhavani sankar', roll: '23B21A4268', college: 'KIET', backlogs: 1, type: 'DS', branch: 'CSM' },
  { teamNum: 1, roleCode: 'SD1', name: 'KOLAMURI BHAVYA SRI', roll: '23JN1A4596', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 1, roleCode: 'SD2', name: 'MAMIDALA GOVIND', roll: '23B21A4541', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 1, roleCode: 'SD3', name: 'BOLISETTI JYOTHI SWARUPA', roll: '23B21A4516', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 1, roleCode: 'SD4', name: 'PANASA.RAJINI', roll: '23JN1A4331', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 1, roleCode: 'JD1', name: 'DASARI NAVEEN KUMAR', roll: '24B21A4419', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSD' },
  { teamNum: 1, roleCode: 'JD2', name: 'MALLIPUDI SATYA KRUPA', roll: '24B21A4213', college: 'KIET', backlogs: 1, type: 'HS', branch: 'CSM' },
  { teamNum: 1, roleCode: 'JD3', name: 'S . Siri Bhuvaneswari', roll: '24JN1A4513', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 1, roleCode: 'JD4', name: 'SABBISETTY ANJANA LAKSHMI ASRITHA', roll: '24JN1A4591', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },

  // Team 2
  { teamNum: 2, roleCode: 'LEAD', name: 'Ashwini', roll: '23JN1A4534', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 2, roleCode: 'SD1', name: 'DEVAGUPTAPU VENKATA SURYA SHANMUKHA', roll: '23JN1A4215', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 2, roleCode: 'SD2', name: 'GIRIDHAR SHYAM SAMSANI', roll: '23B21A4269', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 2, roleCode: 'SD3', name: 'Peddapalli Satya venkata Siva Durga Prasad', roll: '23B21A4591', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 2, roleCode: 'SD4', name: 'GANDHAM SRI LAKSHMI', roll: '23JN1A4533', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 2, roleCode: 'JD1', name: 'BALUKULA SAMPATH', roll: '24B21A4345', college: 'KIET', backlogs: 2, type: 'HS', branch: 'CAI' },
  { teamNum: 2, roleCode: 'JD2', name: 'YUVARAJU BONDADA', roll: '246Q1A4307', college: 'KIET+', backlogs: 0, type: 'HS', branch: 'CAI' },
  { teamNum: 2, roleCode: 'JD3', name: 'MONIKA KONA', roll: '24JN1A4306', college: 'KIEW', backlogs: 1, type: 'HS', branch: 'CAI' },
  { teamNum: 2, roleCode: 'JD4', name: 'CHINTADA RAMYA SRI', roll: '24JN1A4502', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },

  // Team 3
  { teamNum: 3, roleCode: 'LEAD', name: 'Karthik', roll: '23B21A4661', college: 'KIET', backlogs: 1, type: 'HS', branch: 'CSC' },
  { teamNum: 3, roleCode: 'SD1', name: 'Nithin Kumar Mancheela', roll: '23B21A4225', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 3, roleCode: 'SD2', name: 'LAXMI VISALYA SABBISETTI', roll: '23JN1A4543', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 3, roleCode: 'SD3', name: 'MASAA KEERTHI', roll: '23JN1A45A1', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 3, roleCode: 'SD4', name: 'PECHETTI SRI RAMA CHANDRA MURTHI', roll: '23B21A4538', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 3, roleCode: 'JD1', name: 'K HEMA SUPRIYA', roll: '24JN1A4316', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'CAI' },
  { teamNum: 3, roleCode: 'JD2', name: 'ACHANTA SIVA RAMA KRISHNA', roll: '24B21A4576', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 3, roleCode: 'JD3', name: 'BEELA VIVEK', roll: '24B21A43A1', college: 'KIET', backlogs: 1, type: 'DS', branch: 'CAI' },
  { teamNum: 3, roleCode: 'JD4', name: 'BEVARA ANJILI RANI', roll: '24B21A4209', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSM' },

  // Team 4
  { teamNum: 4, roleCode: 'LEAD', name: 'Akhil', roll: '23B21A45B4', college: 'KIET', backlogs: 1, type: 'HS', branch: 'AID' },
  { teamNum: 4, roleCode: 'SD1', name: 'R.BALA NIKHITHA', roll: '23JN1A4581', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 4, roleCode: 'SD2', name: 'PAIDIKONDALA DEVI', roll: '23B21A4506', college: 'KIET', backlogs: 2, type: 'DS', branch: 'AID' },
  { teamNum: 4, roleCode: 'SD3', name: 'LITHIKASRAYA C', roll: '23B21A4618', college: 'KIET', backlogs: 1, type: 'DS', branch: 'CSC' },
  { teamNum: 4, roleCode: 'SD4', name: 'SAI TEJA REVURI', roll: '24B25A4305', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 4, roleCode: 'JD1', name: 'ARIGELA DURGA SAI MANIKANTA', roll: '25B25A4516', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 4, roleCode: 'JD2', name: 'GOLUGURI KEERTHI SRI JYOTHI', roll: '24JN1A4269', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 4, roleCode: 'JD3', name: 'NEELAM MOUNIKA', roll: '24JN1A4526', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 4, roleCode: 'JD4', name: 'MARNI HARISH JAYARAM', roll: '24B21A4281', college: 'KIET', backlogs: 2, type: 'DS', branch: 'CSM' },

  // Team 5
  { teamNum: 5, roleCode: 'LEAD', name: 'Meena', roll: '23JN1A45C0', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 5, roleCode: 'SD1', name: 'MANDADI NAGARATNAKAR', roll: '23B21A45A6', college: 'KIET', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 5, roleCode: 'SD2', name: 'CHELLUMAHANTHI KARTHIK', roll: '23B21A4532', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 5, roleCode: 'SD3', name: 'KOLA SRI RAMARAJU', roll: '23B21A4262', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 5, roleCode: 'SD4', name: 'BINDUSRI TALAKONDA', roll: '23JN1A4565', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 5, roleCode: 'JD1', name: 'GUNTAMUKKALA BHARATHI', roll: '25JN5A4204', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 5, roleCode: 'JD2', name: 'SIRIPURAPU DEEKSHITHA', roll: '24B21A4410', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSD' },
  { teamNum: 5, roleCode: 'JD3', name: 'TADIKALA YASWANTH KUMAR', roll: '24B21A4567', college: 'KIET', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 5, roleCode: 'JD4', name: 'MOTURI TEJA GANESH', roll: '24B21A45C4', college: 'KIET', backlogs: 1, type: 'DS', branch: 'AID' },

  // Team 6
  { teamNum: 6, roleCode: 'LEAD', name: 'Rahul', roll: '23B21A4546', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 6, roleCode: 'SD1', name: 'Rayudu Veera Venkata Swamy', roll: '23B21A4595', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 6, roleCode: 'SD2', name: 'CHINTHALAPUDI VENKATA SATYA SAI ABHISHEK', roll: '23B21A4565', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 6, roleCode: 'SD3', name: 'PALIVELA LAKSHMI TARUN', roll: '23B21A4558', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 6, roleCode: 'SD4', name: 'Gattem Aruna', roll: '23JN1A4314', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 6, roleCode: 'JD1', name: 'MALLA HARSHA VARDHAN', roll: '24B21A4260', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 6, roleCode: 'JD2', name: 'CHENNAMALLI SURENDRA', roll: '24B21A43A5', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 6, roleCode: 'JD3', name: 'ROOPA SRI YENUGU', roll: '24B21A4310', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CAI' },
  { teamNum: 6, roleCode: 'JD4', name: 'Tharun Bole', roll: '25B25A4420', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSD' },

  // Team 7
  { teamNum: 7, roleCode: 'LEAD', name: 'Charan', roll: '23B21A4311', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 7, roleCode: 'SD1', name: 'Thumpala Haribabu', roll: '23B21A4265', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 7, roleCode: 'SD2', name: 'TAMMANA SRI LAKSHMI VASANTHI', roll: '23B21A4202', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 7, roleCode: 'SD3', name: 'GOPISETTI HEMA SAI DEEPTHI', roll: '23JN1A4550', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 7, roleCode: 'SD4', name: 'MOKA DIVYA', roll: '23B21A4301', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 7, roleCode: 'JD1', name: 'BEPALA PURNIMA', roll: '24JN1A4506', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 7, roleCode: 'JD2', name: 'Veeramsetti Y N D Sanjay Bhargav', roll: '24B21A4577', college: 'KIET', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 7, roleCode: 'JD3', name: 'MOTURI LALITHA SOWJANYA', roll: '25B25A4205', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 7, roleCode: 'JD4', name: 'KADIYALA MANI NAGA VENKATESH', roll: '24B21A4494', college: 'KIET', backlogs: 1, type: 'DS', branch: 'CSD' },

  // Team 8
  { teamNum: 8, roleCode: 'LEAD', name: 'Sanjeetha', roll: '23B21A4304', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 8, roleCode: 'SD1', name: 'KATTEBOINA RAVI TEJA', roll: '23B21A4348', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CAI' },
  { teamNum: 8, roleCode: 'SD2', name: 'ACHANTA VEERA KUMARI', roll: '23JN1A4510', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 8, roleCode: 'SD3', name: 'NARUKULA DEVI', roll: '23JN1A45E0', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'AID' },
  { teamNum: 8, roleCode: 'SD4', name: 'YANDAPALLI SAI VARSHITHA', roll: '23B21A4205', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 8, roleCode: 'JD1', name: 'AKSHAYA JOGA', roll: '24JN1A4505', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 8, roleCode: 'JD2', name: 'D.GANGA BHAVANI', roll: '25JN5A4202', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 8, roleCode: 'JD3', name: 'HARSHA VARDHAN ARIPAKA', roll: '24B21A4256', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSM' },
  { teamNum: 8, roleCode: 'JD4', name: 'RAPARTHI DURGA VENKATA MANIKANTA', roll: '25B25A4238', college: 'KIET', backlogs: 0, type: 'DS', branch: 'CSM' },

  // Team 9
  { teamNum: 9, roleCode: 'LEAD', name: 'Aditya', roll: '23B21A4368', college: 'KIET', backlogs: 1, type: 'HS', branch: 'CAI' },
  { teamNum: 9, roleCode: 'SD1', name: 'YELLAPU JAYASREE', roll: '23JN1A4211', college: 'KIEW', backlogs: 0, type: 'DS', branch: 'CSM' },
  { teamNum: 9, roleCode: 'SD2', name: 'Velaga Sai Chandu', roll: '23B21A4297', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSM' },
  { teamNum: 9, roleCode: 'SD3', name: 'Alapati Avinash', roll: '23B21A4378', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CAI' },
  { teamNum: 9, roleCode: 'SD4', name: 'Puligedda Naga Sri Verra Varun', roll: '23B21A4323', college: 'KIET', backlogs: 2, type: 'DS', branch: 'CAI' },
  { teamNum: 9, roleCode: 'JD1', name: 'ANKAMREDDI TEJASRI', roll: '25JN5A4201', college: 'KIEW', backlogs: 0, type: 'HS', branch: 'CSM' },
  { teamNum: 9, roleCode: 'JD2', name: 'KAMBHAMPATI NAVEEN', roll: '25B25A4512', college: 'KIET', backlogs: 0, type: 'HS', branch: 'AID' },
  { teamNum: 9, roleCode: 'JD3', name: 'SEELAMREDDI MUGDHA MOHANA SIVA PRIYA', roll: '25B25A4203', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSM' },
  { teamNum: 9, roleCode: 'JD4', name: 'GUMMADIDALA UMA DEVI', roll: '25B25A4202', college: 'KIET', backlogs: 0, type: 'HS', branch: 'CSM' },
];

const trackNames = {
  1: 'Machine Learning & AI Track',
  2: 'DSA & Problem Solving Track',
  3: 'Full Stack Web Development Track',
  4: 'Web3 & Smart Contracts Track',
  5: 'Cloud & DevOps Automation Track',
  6: 'Open Source Contributions Track',
  7: 'Mobile Application Development Track',
  8: 'Cybersecurity & Network Defense Track',
  9: 'Data Engineering & Analytics Track',
};

async function seedCohort() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully.');

    // 1. Clean existing student users and reset teams
    console.log('Cleaning old team requests and notifications...');
    await TeamRequest.deleteMany({});
    await Notification.deleteMany({});

    console.log('Seeding 9 Cohort Teams...');
    const teamDocMap = {};
    for (let i = 1; i <= 9; i++) {
      let team = await Team.findOne({ teamNumber: i });
      if (!team) {
        team = await Team.create({
          name: `Team ${i}`,
          teamNumber: i,
          track: trackNames[i],
          maxMembers: 9,
          teamLeadId: null,
          members: [],
        });
      } else {
        team.name = `Team ${i}`;
        team.track = trackNames[i];
        team.maxMembers = 9;
        team.teamLeadId = null;
        team.members = [];
        await team.save();
      }
      teamDocMap[i] = team;
    }

    console.log('Processing 81 Students & Leads...');
    const teamLeadsMap = {};
    const teamMembersMap = {};
    for (let i = 1; i <= 9; i++) {
      teamMembersMap[i] = [];
    }

    for (const record of rawCohortData) {
      const cleanRoll = record.roll.trim().toUpperCase();
      const isLead = record.roleCode === 'LEAD';
      const isSenior = isLead || record.roleCode.startsWith('SD');
      const cleanEmail = `${cleanRoll.toLowerCase()}@kiet.edu`;
      const year = cleanRoll.startsWith('23') ? 3 : cleanRoll.startsWith('24') ? 2 : 2;

      // Find or create user
      let user = await User.findOne({
        $or: [{ rollNumber: cleanRoll }, { email: cleanEmail }],
      }).select('+password');

      if (!user) {
        user = new User({
          name: record.name.trim(),
          email: cleanEmail,
          rollNumber: cleanRoll,
          password: cleanRoll, // Will be hashed in pre-save
          college: record.college || 'KIET',
          dayScholarHostel: record.type || 'DS',
          activeBacklogs: Number(record.backlogs) || 0,
          branch: record.branch || 'CSE',
          year,
          memberType: isSenior ? 'senior_developer' : 'junior_developer',
          role: isLead ? 'teamlead' : 'user',
          status: 'active',
          teamId: teamDocMap[record.teamNum]._id,
        });
      } else {
        user.name = record.name.trim();
        user.email = cleanEmail;
        user.rollNumber = cleanRoll;
        user.password = cleanRoll; // Set password to roll number
        user.college = record.college || 'KIET';
        user.dayScholarHostel = record.type || 'DS';
        user.activeBacklogs = Number(record.backlogs) || 0;
        user.branch = record.branch || 'CSE';
        user.year = year;
        user.memberType = isSenior ? 'senior_developer' : 'junior_developer';
        user.role = isLead ? 'teamlead' : 'user';
        user.status = 'active';
        user.teamId = teamDocMap[record.teamNum]._id;
      }

      await user.save();

      if (isLead) {
        teamLeadsMap[record.teamNum] = user._id;
      } else {
        teamMembersMap[record.teamNum].push(user._id);
      }
    }

    // 2. Link team leads and members into Team documents
    console.log('Linking Team Leads and Members to their respective teams...');
    for (let i = 1; i <= 9; i++) {
      const team = teamDocMap[i];
      team.teamLeadId = teamLeadsMap[i] || null;
      team.members = teamMembersMap[i] || [];
      await team.save();
      console.log(`Team ${i} configured: Lead set, ${team.members.length} members linked (Total: ${1 + team.members.length}/9)`);
    }

    // 3. Ensure Admin account exists (admin@ / admin@)
    console.log('Ensuring Admin accounts...');
    let admin = await User.findOne({
      $or: [
        { email: 'admin@c4gt-kiet.in' },
        { rollNumber: 'ADMIN@' },
        { rollNumber: 'admin@' },
        { rollNumber: 'ADMIN' },
      ],
    }).select('+password');

    if (!admin) {
      admin = new User({
        name: 'C4GT Admin',
        email: 'admin@c4gt-kiet.in',
        rollNumber: 'ADMIN@',
        password: 'admin@',
        role: 'admin',
        status: 'active',
      });
      await admin.save();
      console.log('Created Admin account: ADMIN@ / admin@ (email: admin@c4gt-kiet.in)');
    } else {
      admin.role = 'admin';
      admin.password = 'admin@';
      admin.rollNumber = 'ADMIN@';
      await admin.save();
      console.log('Updated Admin account: ADMIN@ / admin@');
    }

    // Also ensure secondary admin for developer testing
    let tarunAdmin = await User.findOne({ email: 'lakshmitaruntarun@gmail.com' });
    if (tarunAdmin) {
      tarunAdmin.role = 'admin';
      tarunAdmin.password = 'admin123';
      await tarunAdmin.save();
      console.log('Preserved Tarun Admin: lakshmitaruntarun@gmail.com / admin123');
    }

    console.log('\n===========================================');
    console.log('SUCCESS! Predefined Cohort Data Seeded!');
    console.log('- 9 Teams (Teams 1 through 9) initialized with tracks');
    console.log('- 81 Students seeded with password = Roll Number');
    console.log('- 9 Team Leads directly assigned to teamLeadId');
    console.log('- 72 Members (4 SD + 4 JD per team) directly linked');
    console.log('- Admin Login: ADMIN / admin123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

seedCohort();
