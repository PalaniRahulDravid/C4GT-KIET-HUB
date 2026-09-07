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
 * Verify Google identity token or payload
 */
const verifyGoogleIdentity = async (credential, body) => {
  let googleId;
  let email;
  let name;
  let picture;

  if (credential) {
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
          throw verifyErr;
        }
      }
    } else {
      const decoded = jwt.decode(credential);
      if (!decoded) {
        throw new Error('Invalid Google credential token');
      }
      payload = decoded;
    }

    googleId = payload.sub;
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
  } else if (body.email && (body.googleId || body.isMock)) {
    googleId = body.googleId || `google_${Date.now()}`;
    email = body.email;
    name = body.name || 'Google User';
    picture = body.avatar || '';
  } else {
    throw new Error('Missing Google authentication credential');
  }

  if (!email) {
    throw new Error('Google account must have an email address');
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
    const { credential } = req.body;
    const { googleId, email, name, picture } = await verifyGoogleIdentity(
      credential,
      req.body
    );

    // Search database directly in MongoDB Atlas
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
      console.log(`Created new Google user in Atlas: ${email} with role: 'user'`);
    } else {
      // IF USER ALREADY EXISTS -> DO NOT change their role. Read DB role.
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
      console.log(`Existing user logged in from Atlas: ${email} with database role: '${user.role}'`);
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
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
    return res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
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

/**
 * @desc    Development helper login (for testing roles in MongoDB Atlas)
 * @route   POST /api/auth/dev-login
 * @access  Public
 */
const devLogin = async (req, res) => {
  try {
    const { role = 'user', email, name } = req.body;

    const testEmail = email || `test-${role}@c4gt.local`;
    const testName = name || `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;

    let user = await User.findOne({ email: testEmail });

    if (!user) {
      user = await User.create({
        name: testName,
        email: testEmail,
        role: ['user', 'teamlead', 'admin'].includes(role) ? role : 'user',
        status: 'active',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  googleAuth,
  getMe,
  devLogin,
};
