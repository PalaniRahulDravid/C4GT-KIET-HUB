const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for logged-in student
 * @route   GET /api/student/notifications
 * @access  Private (Student)
 */
const getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;
    const notifications = await Notification.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      studentId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications',
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/student/notifications/:id/read
 * @access  Private (Student)
 */
const markNotificationRead = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, studentId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      studentId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

/**
 * @desc    Mark all notifications as read for logged-in student
 * @route   PATCH /api/student/notifications/read-all
 * @access  Private (Student)
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const studentId = req.user._id;

    await Notification.updateMany(
      { studentId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read',
    });
  }
};

module.exports = {
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
