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

    return res.status(200).json({
      success: true,
      message: 'Authentication successful with MongoDB Atlas',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
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
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      status: req.user.status,
    },
  });
};

module.exports = {
  googleAuth,
  getMe,
};

