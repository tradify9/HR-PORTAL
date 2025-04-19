const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
});

module.exports = mongoose.model('Attendance', attendanceSchema);