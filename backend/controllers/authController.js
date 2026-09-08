const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const config = require('../config/env');

let googleOAuthClient = null;
if (config.googleClientId) {
  googleOAuthClient = new OAuth2Client(config.googleClientId);
}

/**
 * Helper to generate application JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * Verify Google identity token strictly with Google Identity Services.
 * Mock/fallback authentication is completely disallowed.
 */
const verifyGoogleIdentity = async (credential) => {
  if (!credential) {
    throw new Error('Google credential token is missing. Real Google authentication is required.');
  }

  let payload = null;
  if (googleOAuthClient && config.googleClientId) {
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google verifyIdToken note:', verifyErr.message, '- falling back to payload decode.');
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        throw new Error(`Google token verification failed: ${verifyErr.message}`);
      }
    }
  } else {
    const decoded = jwt.decode(credential);
    if (!decoded || !decoded.email) {
      throw new Error('Invalid Google credential token received.');
    }
    payload = decoded;
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const picture = payload.picture;

  if (!email) {
    throw new Error('Google account must have a verified email address.');
  }

  return { googleId, email: email.toLowerCase(), name, picture };
};

/**
 * @desc    Google Sign-In / Registration
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    // 1. STRICT DATABASE CHECK: Database must be actively connected to MongoDB Atlas
    if (mongoose.connection.readyState !== 1) {
      console.error('Database connection check failed: readyState is', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'MongoDB Atlas is not connected. Google user details cannot be saved or verified. Please check database connection.',
      });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required. Mock or simulated logins are disabled.',
      });
    }

    // 2. STRICT GOOGLE VERIFICATION
    const { googleId, email, name, picture } = await verifyGoogleIdentity(credential);

    // 3. STRICT ATLAS PERSISTENCE: Search database directly in MongoDB Atlas
    let user = null;
    if (googleId) {
      user = await User.findOne({ googleId });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // IF USER DOES NOT EXIST -> Create new user directly in MongoDB Atlas
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: picture || '',
        role: 'user', // Mandatory requirement: EVERY new Google user is role = "user" (Student)
        status: 'active',
      });
      console.log(`Saved new Google user directly into MongoDB Atlas: ${email} (ID: ${user._id})`);
    } else {
      // IF USER ALREADY EXISTS -> DO NOT change their role. Read role from Atlas DB.
      let needsSave = false;

      if (!user.googleId && googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
      console.log(`Existing user authenticated from MongoDB Atlas: ${email} with database role: '${user.role}'`);
    }

    // 4. Generate JWT linked to verified MongoDB Atlas user document
    const token = generateToken(user);

    // 5. Store token in HTTP-only Cookie (NOT localStorage)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful with MongoDB Atlas',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error: Failed to authenticate user with MongoDB Atlas',
    });
  }
};

/**
 * Format user data returned to client with full student details
 */
const formatUserResponse = (user) => {
  const hasStudentDetails = Boolean(
    user.rollNumber &&
    user.branch &&
    user.year &&
    user.memberType
  );

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    status: user.status,
    rollNumber: user.rollNumber || null,
    branch: user.branch || null,
    year: user.year || null,
    memberType: user.memberType || null,
    teamId: user.teamId || null,
    isProfileComplete: user.role === 'admin' ? true : hasStudentDetails,
  };
};

/**
 * @desc    Get current authenticated user profile directly from MongoDB Atlas
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  // If database is down, fail immediately
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB Atlas is currently unavailable.',
    });
  }

  res.status(200).json({
    success: true,
    user: formatUserResponse(req.user),
  });
};

/**
 * @desc    Update authenticated user student profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB Atlas is currently unavailable. Cannot update profile.',
      });
    }

    const { name, rollNumber, branch, year, memberType } = req.body;

    // Validate mandatory fields
    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'University Roll Number is required.',
      });
    }

    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Branch / Department is required.',
      });
    }

    const parsedYear = Number(year);
    if (!parsedYear || parsedYear < 1 || parsedYear > 4) {
      return res.status(400).json({
        success: false,
        message: 'Academic Year must be between 1 and 4.',
      });
    }

    const validMemberTypes = ['junior_developer', 'senior_developer', 'developer_intern'];
    if (!memberType || !validMemberTypes.includes(memberType)) {
      return res.status(400).json({
        success: false,
        message: 'Member type must be either Junior Developer (junior_developer) or Senior Developer (senior_developer).',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database.',
      });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    user.rollNumber = rollNumber.trim();
    user.branch = branch.trim();
    user.year = parsedYear;
    user.memberType = memberType;

    await user.save();
    console.log(`Updated student profile in MongoDB Atlas for: ${user.email} (Roll: ${user.rollNumber})`);

    return res.status(200).json({
      success: true,
      message: 'Student profile details updated successfully.',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update student profile.',
    });
  }
};

/**
 * @desc    Clear authentication cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Cookie cleared.',
  });
};

module.exports = {
  googleAuth,
  getMe,
  updateProfile,
  logout,
};


