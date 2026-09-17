const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  require('../models/User');
  require('../models/Resource');
  const Team = require('../models/Team');
  const Task = require('../models/Task');
  const TaskAssignment = require('../models/TaskAssignment');
  const User = require('../models/User');

  // Test with Swamy
  const swamy = await User.findOne({ email: 'swamyrayudu7288@gmail.com' });
  const studentId = swamy._id;

  // Let's test the enhanced query logic
  let studentTeamDoc = null;
  if (swamy.teamId) {
    studentTeamDoc = await Team.findById(swamy.teamId);
  }
  if (!studentTeamDoc) {
    studentTeamDoc = await Team.findOne({
      $or: [{ members: studentId }, { teamLeadId: studentId }],
    });
  }

  const teamNumber = studentTeamDoc ? studentTeamDoc.teamNumber : null;
  const leadId = studentTeamDoc ? studentTeamDoc.teamLeadId : null;

  const assignments = await TaskAssignment.find({ studentId }).populate('reviewedBy', 'name email avatar role');
  const explicitTaskIds = assignments.map((a) => a.taskId);

  let targetGroups = ['both'];
  if (swamy.memberType === 'junior_developer') {
    targetGroups.push('junior_developers');
  } else if (
    swamy.memberType === 'senior_developer' ||
    swamy.memberType === 'developer_intern'
  ) {
    targetGroups.push('developer_interns');
  } else {
    targetGroups.push('junior_developers', 'developer_interns');
  }

  const queryConditions = [
    { _id: { $in: explicitTaskIds } },
    { assignedTo: studentId },
  ];

  const teamQueries = [];
  if (teamNumber) {
    teamQueries.push(
      { assignedTeams: teamNumber },
      { assignedTeams: Number(teamNumber) },
      { assignedTeams: String(teamNumber) }
    );
  }

  if (leadId) {
    queryConditions.push({ createdBy: leadId });
  }

  if (teamQueries.length > 0) {
    queryConditions.push({
      $and: [
        { $or: teamQueries },
        {
          $or: [
            { targetGroup: { $in: [...targetGroups, 'both', 'individual', 'all'] } },
            { targetGroup: { $exists: false } },
            { targetGroup: null },
          ],
        },
      ],
    });
  } else {
    queryConditions.push({
      assignedTeams: { $exists: true },
      targetGroup: { $in: [...targetGroups, 'both', 'individual', 'all'] },
    });
  }

  const query = { $or: queryConditions };

  let tasks = await Task.find(query)
    .sort({ deadline: 1 })
    .populate('createdBy', 'name email avatar role')
    .populate('relatedResources');

  console.log('Enhanced query returned:', tasks.length, 'tasks for Swamy:');
  tasks.forEach(t => {
    const creatorRole = t.createdBy?.role ? String(t.createdBy.role).toLowerCase().trim() : '';
    const isLeadCreator = leadId && t.createdBy?._id && t.createdBy._id.toString() === leadId.toString();
    let source = 'teamlead';
    if (creatorRole === 'admin') {
      source = 'admin';
    } else if (creatorRole === 'teamlead' || creatorRole === 'team_lead' || isLeadCreator || t.taskScope === 'students' || t.taskScope === 'individual') {
      source = 'teamlead';
    } else if (Array.isArray(t.assignedTeams) && t.assignedTeams.length > 1) {
      source = 'admin';
    } else {
      source = 'teamlead';
    }
    console.log('  *', t.title, '| source:', source, '| createdBy:', t.createdBy ? t.createdBy.name : 'null');
  });

  await mongoose.disconnect();
}
run().catch(console.error);
