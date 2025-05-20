// backend/seedAdmin.js
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');
require('dotenv').config();

const seedAdmin = async () => {
  await connectDB();
  const admin = new Admin({
    username: 'hr@fintradify.com',
    password: 'admin1234',
  });
  await admin.save();
  console.log('Admin created');
  mongoose.connection.close();
};

seedAdmin();