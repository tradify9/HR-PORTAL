const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Salary = require('../models/Salary');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { generatePDF } = require('../utils/generatePDF');

exports.login = async (req, res) => {
  const { email, employeeId } = req.body;
  try {
    const employee = await Employee.findOne({ email, employeeId });
    if (!employee) return res.status(401).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: employee._id, role: 'employee' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.json({ token, employee });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.requestLeave = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  try {
    const leave = new Leave({
      employeeId: req.user.id,
      startDate,
      endDate,
      reason,
    });
    await leave.save();
    res.json({ msg: 'Leave requested' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getSalarySlip = async (req, res) => {
  const { month } = req.query;
  try {
    const employee = await Employee.findById(req.user.id);
    let salary = await Salary.findOne({ employeeId: req.user.id, month });
    if (!salary) {
      const salaryData = await require('./salaryController').calculateSalary(req.user.id, month);
      salary = new Salary({
        employeeId: req.user.id,
        month,
        ...salaryData,
      });
      await salary.save();
    }
    const pdfBuffer = await generatePDF(employee, salary);

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employee.email,
      subject: `Salary Slip for ${month}`,
      text: `Dear ${employee.name},\n\nPlease find attached your salary slip for ${month}.\n\nBest regards,\nHR Team`,
      attachments: [
        {
          filename: `salary_slip_${month}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send PDF as response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=salary_slip_${month}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) { 
    console.error('Error in getSalarySlip:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};