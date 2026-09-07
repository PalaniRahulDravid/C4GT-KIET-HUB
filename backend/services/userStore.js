const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory store used when MongoDB is not connected (e.g. offline, IP whitelist pending in Atlas)
const inMemoryUsers = [
  {
    _id: 'mem_admin_001',
    name: 'Admin User',
    email: 'admin@kiet.edu',
    role: 'admin',
    status: 'active',
    avatar: '',
    createdAt: new Date('2026-01-01'),
  },
  {
    _id: 'mem_teamlead_001',
    name: 'Team Lead User',
    email: 'teamlead@kiet.edu',
    role: 'teamlead',
    status: 'active',
    avatar: '',
    createdAt: new Date('2026-01-02'),
  },
  {
    _id: 'mem_student_001',
    name: 'Student User',
    email: 'student@kiet.edu',
    role: 'user',
    status: 'active',
    avatar: '',
    createdAt: new Date('2026-01-03'),
  },
];

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// When MongoDB Atlas connects or reconnects, sync any newly registered users directly into Atlas
mongoose.connection.on('connected', async () => {
  console.log('MongoDB Atlas connected! Ensuring registered users are stored in Atlas...');
  try {
    for (const memUser of inMemoryUsers) {
      const existing = await User.findOne({ email: memUser.email });
      if (!existing) {
        await User.create({
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          googleId: memUser.googleId || undefined,
          avatar: memUser.avatar || '',
          status: memUser.status || 'active',
        });
        console.log(`Successfully persisted user ${memUser.email} (${memUser.role}) to MongoDB Atlas.`);
      }
    }
  } catch (err) {
    console.warn('Atlas user sync notice:', err.message);
  }
});

/**
 * Find user by ID
 */
const findById = async (id) => {
  if (isDbConnected()) {
    try {
      return await User.findById(id);
    } catch (err) {
      console.warn('MongoDB findById failed, checking in-memory fallback:', err.message);
    }
  }
  const memUser = inMemoryUsers.find((u) => u._id.toString() === id.toString() || u.id?.toString() === id.toString());
  if (memUser) {
    return wrapInMemoryUser(memUser);
  }
  return null;
};

/**
 * Find one user by criteria (e.g. { googleId }, { email })
 */
const findOne = async (criteria) => {
  if (isDbConnected()) {
    try {
      return await User.findOne(criteria);
    } catch (err) {
      console.warn('MongoDB findOne failed, checking in-memory fallback:', err.message);
    }
  }

  const { googleId, email } = criteria;
  const memUser = inMemoryUsers.find((u) => {
    if (googleId && u.googleId === googleId) return true;
    if (email && u.email.toLowerCase() === email.toLowerCase()) return true;
    return false;
  });

  if (memUser) {
    return wrapInMemoryUser(memUser);
  }
  return null;
};

/**
 * Create a new user
 */
const createUser = async (userData) => {
  const normalizedRole = userData.role === 'student' ? 'user' : userData.role === 'team_lead' ? 'teamlead' : (userData.role || 'user');
  
  if (isDbConnected()) {
    try {
      return await User.create({
        ...userData,
        role: normalizedRole,
      });
    } catch (err) {
      console.warn('MongoDB createUser failed, writing to in-memory fallback:', err.message);
    }
  }

  const newMemUser = {
    _id: `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: userData.name || 'User',
    email: userData.email.toLowerCase(),
    role: normalizedRole,
    googleId: userData.googleId || null,
    avatar: userData.avatar || '',
    status: userData.status || 'active',
    createdAt: new Date(),
  };

  inMemoryUsers.push(newMemUser);
  return wrapInMemoryUser(newMemUser);
};

/**
 * Get all users for Admin
 */
const findAllUsers = async () => {
  if (isDbConnected()) {
    try {
      return await User.find().sort({ createdAt: -1 }).select('-__v');
    } catch (err) {
      console.warn('MongoDB findAllUsers failed, retrieving in-memory users:', err.message);
    }
  }

  return [...inMemoryUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Update user role
 */
const updateUserRole = async (id, newRole) => {
  const normalizedRole = newRole === 'student' ? 'user' : newRole === 'team_lead' ? 'teamlead' : newRole;

  if (isDbConnected()) {
    try {
      const user = await User.findById(id);
      if (user) {
        user.role = normalizedRole;
        await user.save();
        return user;
      }
    } catch (err) {
      console.warn('MongoDB updateUserRole failed, updating in-memory:', err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id.toString() === id.toString() || u.id?.toString() === id.toString());
  if (memUser) {
    memUser.role = normalizedRole;
    return wrapInMemoryUser(memUser);
  }
  return null;
};

/**
 * Helper to wrap plain object to behave like Mongoose document
 */
function wrapInMemoryUser(raw) {
  return {
    _id: raw._id,
    id: raw._id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    googleId: raw.googleId,
    avatar: raw.avatar,
    status: raw.status,
    createdAt: raw.createdAt,
    save: async function () {
      raw.name = this.name;
      raw.email = this.email;
      raw.role = this.role;
      raw.googleId = this.googleId;
      raw.avatar = this.avatar;
      raw.status = this.status;
      return this;
    },
  };
}

module.exports = {
  isDbConnected,
  findById,
  findOne,
  createUser,
  findAllUsers,
  updateUserRole,
};
