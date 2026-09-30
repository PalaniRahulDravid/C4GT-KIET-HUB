const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');

/**
 * Check if a student's memberType qualifies for a task's targetGroup
 * @param {Object|string} student User document, object with memberType, or memberType string
 * @param {string} targetGroup Task targetGroup (junior_developers, developer_interns, senior_developers, both, all)
 * @returns {boolean}
 */
const isEligibleMember = (student, targetGroup) => {
  if (!student) return false;
  if (!targetGroup || targetGroup === 'both' || targetGroup === 'all') return true;
  const mType = typeof student === 'string' ? student : (student.memberType || '');
  if (targetGroup === 'junior_developers') {
    return mType === 'junior_developer';
  }
  if (targetGroup === 'developer_interns' || targetGroup === 'senior_developers') {
    return mType === 'senior_developer' || mType === 'developer_intern';
  }
  return true;
};

/**
 * Synchronize task assignments when a student's memberType / role changes.
 * Removes unsubmitted/pending assignments for tasks that do not match the new role.
 * @param {string|ObjectId} userId
 * @param {string} newMemberType ('junior_developer' | 'senior_developer' | 'developer_intern')
 */
const syncUserTaskAssignmentsOnRoleChange = async (userId, newMemberType) => {
  try {
    if (!userId || !newMemberType) return;

    if (newMemberType === 'senior_developer' || newMemberType === 'developer_intern') {
      // User promoted to senior: remove pending assignments for junior-only tasks
      const juniorTasks = await Task.find({ targetGroup: 'junior_developers' }).select('_id');
      const juniorTaskIds = juniorTasks.map((t) => t._id);
      if (juniorTaskIds.length > 0) {
        await TaskAssignment.deleteMany({
          studentId: userId,
          taskId: { $in: juniorTaskIds },
          status: { $in: ['pending', 'in_progress'] },
        });
      }
    } else if (newMemberType === 'junior_developer') {
      // User set to junior: remove pending assignments for senior/intern-only tasks
      const seniorTasks = await Task.find({
        targetGroup: { $in: ['senior_developers', 'developer_interns'] },
      }).select('_id');
      const seniorTaskIds = seniorTasks.map((t) => t._id);
      if (seniorTaskIds.length > 0) {
        await TaskAssignment.deleteMany({
          studentId: userId,
          taskId: { $in: seniorTaskIds },
          status: { $in: ['pending', 'in_progress'] },
        });
      }
    }
  } catch (err) {
    console.warn('syncUserTaskAssignmentsOnRoleChange warning:', err.message);
  }
};

module.exports = {
  isEligibleMember,
  syncUserTaskAssignmentsOnRoleChange,
};
