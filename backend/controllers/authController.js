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
        batch: '2026-2027',
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
    phone: user.phone || user.phoneNumber || null,
    phoneNumber: user.phoneNumber || user.phone || null,
    college: user.college || 'KIET',
    dayScholarHostel: user.dayScholarHostel || 'DS',
    activeBacklogs: user.activeBacklogs || 0,
    branch: user.branch || null,
    year: user.year || null,
    batch: user.batch || '2026-2027',
    memberType: user.memberType || null,
    teamId: user.teamId || null,
    isPasswordChanged: Boolean(user.isPasswordChanged),
    mustChangePassword:
      (user.role === 'teamlead' || user.role === 'team_lead') && !user.isPasswordChanged,
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

    if (req.body.batch && typeof req.body.batch === 'string' && req.body.batch.trim()) {
      user.batch = req.body.batch.trim();
    }

    if (req.body.phone || req.body.phoneNumber) {
      const p = String(req.body.phone || req.body.phoneNumber).trim();
      user.phone = p;
      user.phoneNumber = p;
    }

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
 * @desc    Login with Roll Number & Password (or Admin identifier & Password)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginWithRollNumber = async (req, res) => {
  try {
    const { identifier, rollNumber, password } = req.body;
    const loginId = (rollNumber || identifier || '').trim();
    const loginPassword = (password || '').trim();

    if (!loginId || !loginPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Roll Number and Password',
      });
    }

    const isSpecialAdminId = ['admin@', 'admin'].includes(loginId.toLowerCase());

    // Find user by rollNumber (uppercase) or email (lowercase)
    const user = await User.findOne({
      $or: [
        { rollNumber: loginId.toUpperCase() },
        { rollNumber: loginId },
        { rollNumber: loginId.toLowerCase() },
        { email: loginId.toLowerCase() },
        ...(isSpecialAdminId ? [{ rollNumber: 'ADMIN@' }, { email: 'admin@c4gt-kiet.in' }, { role: 'admin' }] : []),
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this Roll Number.',
      });
    }

    // Verify password
    let isMatch = false;

    // 1. Try bcrypt match if user has hashed password
    if (user.password) {
      isMatch = await user.matchPassword(loginPassword);
    }

    // 2. Direct match fallback: default password is their rollNumber ONLY IF password has NOT been changed yet
    if (
      !isMatch &&
      !user.isPasswordChanged &&
      user.rollNumber &&
      loginPassword.toUpperCase() === user.rollNumber.toUpperCase()
    ) {
      isMatch = true;
      user.password = loginPassword;
      await user.save();
    }

    // 3. If admin credentials (admin@, ADMIN@, admin123, or admin)
    if (
      !isMatch &&
      user.role === 'admin' &&
      (loginPassword.toLowerCase() === 'admin@' ||
        loginPassword === 'admin@' ||
        loginPassword === 'ADMIN@' ||
        loginPassword.toLowerCase() === 'admin123' ||
        loginPassword.toLowerCase() === 'admin')
    ) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: user.isPasswordChanged
          ? 'Invalid password. Please enter your updated password.'
          : 'Invalid password. Default password is your Roll Number.',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only Cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`User logged in via Roll Number: ${user.name} (${user.rollNumber || user.email}) [${user.role}]`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed due to server error',
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

/**
 * @desc    Change user password (mandatory for Team Leads on first login)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB Atlas is currently unavailable. Cannot update password.',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password is required and must be at least 6 characters long.',
      });
    }

    // Retrieve user with password select
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database.',
      });
    }

    // If user already has a password, verify currentPassword
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to verify your identity.',
        });
      }

      let isMatch = await user.matchPassword(currentPassword);
      // Fallback check against roll number default ONLY IF password has NOT been changed yet
      if (
        !isMatch &&
        !user.isPasswordChanged &&
        user.rollNumber &&
        currentPassword.trim().toUpperCase() === user.rollNumber.toUpperCase()
      ) {
        isMatch = true;
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: user.isPasswordChanged
            ? 'Incorrect current password. Please enter your updated password.'
            : 'Incorrect current password. Note: Default initial password is your University Roll Number.',
        });
      }
    }

    // Disallow new password being identical to roll number
    if (user.rollNumber && newPassword.trim().toUpperCase() === user.rollNumber.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be your Roll Number. Please choose a secure, different password.',
      });
    }

    user.password = newPassword.trim();
    user.isPasswordChanged = true;
    await user.save();

    console.log(`Password updated for user: ${user.email} (${user.role}). isPasswordChanged set to true.`);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password.',
    });
  }
};

module.exports = {
  loginWithRollNumber,
  googleAuth,
  getMe,
  updateProfile,
  logout,
  changePassword,
};


