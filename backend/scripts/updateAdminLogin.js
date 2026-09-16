const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@', salt);

    let admin = await User.findOne({
      $or: [
        { rollNumber: 'ADMIN@' },
        { rollNumber: 'admin@' },
        { rollNumber: 'ADMIN' },
        { email: 'admin@c4gt-kiet.in' },
      ],
    });

    if (admin) {
      await User.updateOne(
        { _id: admin._id },
        {
          $set: {
            name: 'C4GT Admin',
            email: 'admin@c4gt-kiet.in',
            rollNumber: 'ADMIN@',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
          },
        }
      );
      console.log('Admin account updated with Roll Number: ADMIN@ and password: admin@');
    } else {
      await User.create({
        name: 'C4GT Admin',
        email: 'admin@c4gt-kiet.in',
        rollNumber: 'ADMIN@',
        password: 'admin@',
        role: 'admin',
        status: 'active',
      });
      console.log('Admin account created with Roll Number: ADMIN@ and password: admin@');
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to update admin login:', err);
    process.exit(1);
  }
}

updateAdmin();
