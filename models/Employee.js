const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, required: true }, // Custom employeeId (e.g., EMP-2025-001)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  designation: { type: String, required: true },
  salary: { type: Number, required: true },
  photo: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Employee', employeeSchema);