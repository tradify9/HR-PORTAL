const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const jwt = require('jsonwebtoken');
const { generateCSV } = require('../utils/generateCSV');
const csvParse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.addEmployee = async (req, res) => {
  const { name, email, designation, salary } = req.body;
  const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

  // Validate required fields
  if (!name || !email || !designation || !salary) {
    return res.status(400).json({ msg: 'All fields (name, email, designation, salary) are required' });
  }

  try {
    // Generate professional employee ID
    const year = new Date().getFullYear();
    // Find the latest employee ID for the current year
    const latestEmployee = await Employee.findOne({
      employeeId: { $regex: `^TRD-${year}-` },
    })
      .sort({ employeeId: -1 })
      .select('employeeId');

    let sequence = 1; // Default sequence if no employees exist for the year
    if (latestEmployee) {
      const match = latestEmployee.employeeId.match(/TRD-\d{4}-(\d{3})/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1; // Increment the latest sequence
      }
    }
    const employeeId = `TRD-${year}-${String(sequence).padStart(3, '0')}`;

    // Check for duplicate email
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    // Create new employee
    const employee = new Employee({
      employeeId,
      name,
      email,
      designation,
      salary: parseFloat(salary),
      photo,
    });

    await employee.save();

    // Send email to employee with details
    const emailHtml = `
      <h2>Welcome to Fintradify!</h2>
      <p>Your employee account has been successfully created. Below are your details:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="border: 1px solid #ddd;">
          <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Field</th>
          <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Details</th>
        </tr>
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px;">Employee ID</td>
          <td style="padding: 8px;">${employeeId}</td>
        </tr>
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px;">Name</td>
          <td style="padding: 8px;">${name}</td>
        </tr>
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px;">Email</td>
          <td style="padding: 8px;">${email}</td>
        </tr>
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px;">Designation</td>
          <td style="padding: 8px;">${designation}</td>
        </tr>
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px;">Salary</td>
          <td style="padding: 8px;">₹${parseFloat(salary).toLocaleString('en-IN')}</td>
        </tr>
        ${
          photo
            ? `<tr style="border: 1px solid #ddd;">
                 <td style="padding: 8px;">Photo</td>
                 <td style="padding: 8px;"><img src="http://localhost:5000${photo}" alt="Profile Photo" style="max-width: 100px;"></td>
               </tr>`
            : ''
        }
      </table>
      <p>Please use your <strong>Employee ID</strong> and <strong>Email</strong> to log in to the HR Portal.</p>
      <p>Best regards,<br>Fintradify HR Team</p>
    `;

    try {
      await sendEmail(
        email,
        'Your Employee Account Details - Fintradify',
        emailHtml
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({ msg: 'Employee added successfully', employee });
  } catch (error) {
    console.error('Error adding employee:', error);
    if (error.code === 11000) {
      // Distinguish between email and employeeId duplicates
      if (error.keyPattern?.email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      if (error.keyPattern?.employeeId) {
        return res.status(400).json({ msg: 'Employee ID already exists' });
      }
    }
    res.status(500).json({ msg: 'Server error while adding employee', error: error.message });
  }
};

exports.editEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, designation, salary } = req.body;
  const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.designation = designation || employee.designation;
    employee.salary = salary ? parseFloat(salary) : employee.salary;
    if (photo) employee.photo = photo;
    await employee.save();
    res.json({ msg: 'Employee updated', employee });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    res.json({ msg: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.uploadCSV = async (req, res) => {
  try {
    const employees = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParse.parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', (row) => {
        if (row.name && row.email && row.designation && row.salary) {
          employees.push({
            name: row.name,
            email: row.email,
            designation: row.designation,
            salary: parseFloat(row.salary),
          });
        }
      })
      .on('end', async () => {
        const year = new Date().getFullYear();
        let employeeCount = await Employee.countDocuments();
        for (let emp of employees) {
          employeeCount++;
          const employeeId = `EMP-${year}-${String(employeeCount).padStart(3, '0')}`;
          await Employee.create({ ...emp, employeeId });
        }
        fs.unlinkSync(req.file.path);
        res.json({ msg: 'Employees added from CSV' });
      })
      .on('error', (error) => {
        res.status(500).json({ msg: 'Error parsing CSV' });
      });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('employeeId', 'name employeeId email');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.downloadAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('employeeId', 'name employeeId email');
    const csv = generateCSV(attendance);
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getLeaveRequests = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employeeId', 'name employeeId email');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { leaveId, status } = req.body;
  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ msg: 'Leave request not found' });
    leave.status = status;
    await leave.save();
    res.json({ msg: 'Leave status updated' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};