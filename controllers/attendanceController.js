const Attendance = require('../models/Attendance');
const moment = require('moment');

exports.punchIn = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const existingAttendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });
    if (existingAttendance) return res.status(400).json({ msg: 'Already punched in today' });

    const attendance = new Attendance({
      employeeId: req.user.id,
      date: today,
      punchIn: new Date(),
    });
    await attendance.save();
    res.json({ msg: 'Punched in successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });
    if (!attendance) return res.status(400).json({ msg: 'No punch-in record found' });
    if (attendance.punchOut) return res.status(400).json({ msg: 'Already punched out' });

    attendance.punchOut = new Date();
    await attendance.save();
    res.json({ msg: 'Punched out successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ employeeId: req.user.id }).populate('employeeId', 'name employeeId email');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};