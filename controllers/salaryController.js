const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

exports.calculateSalary = async (req, res) => {
  try {
    const { employeeId, date } = req.params;
    console.log(`Request for employeeId: ${employeeId}, date: ${date}`);

    if (!employeeId.match(/^EMP-\d{4}-\d{3}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID must be like EMP-2025-001',
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log(`No employee found for ID: ${employeeId}`);
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const record = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!record) {
      console.log(`No attendance record found for ID: ${employeeId}, date: ${date}`);
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for the specified date',
      });
    }

    const punchIn = new Date(record.punchIn);
    const punchOut = new Date(record.punchOut);
    const hoursWorked = (punchOut - punchIn) / (1000 * 60 * 60);
    let salaryEarned = 0;

    if (hoursWorked < 5) {
      salaryEarned = employee.salary * 0.5;
    } else if (hoursWorked >= 8) {
      salaryEarned = employee.salary;
    } else {
      salaryEarned = (hoursWorked / 8) * employee.salary;
    }

    const deductions = 10;
    const grossSalary = Number(salaryEarned) || 0;
    const deductionAmount = (deductions / 100) * grossSalary;
    const netSalary = grossSalary - deductionAmount;

    const formattedRecord = {
      employeeId: {
        employeeId: employee.employeeId,
        name: employee.name,
        designation: employee.designation,
        salary: employee.salary
      },
      date: new Date(record.date).toLocaleDateString('en-GB'),
      punchIn: punchIn.toLocaleTimeString('en-GB'),
      punchOut: punchOut.toLocaleTimeString('en-GB'),
      hoursWorked: hoursWorked.toFixed(2),
      salaryEarned: grossSalary.toFixed(2),
      deductions: deductions.toFixed(2),
      netSalary: netSalary.toFixed(2)
    };

    res.json({
      success: true,
      data: formattedRecord
    });
  } catch (err) {
    console.error(`Error for employeeId ${req.params.employeeId}, date ${req.params.date}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

exports.calculateSalaryRange = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.params;
    console.log(`Range request for employeeId: ${employeeId}, startDate: ${startDate}, endDate: ${endDate}`);

    if (!employeeId.match(/^EMP-\d{4}-\d{3}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID must be like EMP-2025-001',
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      console.log(`No employee found for ID: ${employeeId}`);
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Calculate total days (inclusive)
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const records = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: start, $lte: end }
    });

    if (!records || records.length === 0) {
      console.log(`No attendance records found for ID: ${employeeId}, range: ${startDate} to ${endDate}`);
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for the specified date range',
      });
    }

    const formattedRecords = records.map(record => {
      const punchIn = new Date(record.punchIn);
      const punchOut = new Date(record.punchOut);
      const hoursWorked = (punchOut - punchIn) / (1000 * 60 * 60);
      let salaryEarned = 0;

      if (hoursWorked < 5) {
        salaryEarned = employee.salary * 0.5;
      } else if (hoursWorked >= 8) {
        salaryEarned = employee.salary;
      } else {
        salaryEarned = (hoursWorked / 8) * employee.salary;
      }

      const deductions = 10;
      const grossSalary = Number(salaryEarned) || 0;
      const deductionAmount = (deductions / 100) * grossSalary;
      const netSalary = grossSalary - deductionAmount;

      return {
        date: new Date(record.date).toLocaleDateString('en-GB'),
        punchIn: punchIn.toLocaleTimeString('en-GB'),
        punchOut: punchOut.toLocaleTimeString('en-GB'),
        hoursWorked: hoursWorked.toFixed(2),
        salaryEarned: grossSalary.toFixed(2),
        deductions: deductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
        workType: hoursWorked < 5 ? 'Half-Day' : hoursWorked >= 8 ? 'Full-Day' : 'Proportional'
      };
    });

    const summary = {
      totalDays,
      halfDays: formattedRecords.filter(r => r.workType === 'Half-Day').length,
      fullDays: formattedRecords.filter(r => r.workType === 'Full-Day').length,
      proportionalDays: formattedRecords.filter(r => r.workType === 'Proportional').length,
      totalWorkingDays: formattedRecords.length,
      totalGrossSalary: formattedRecords.reduce((sum, r) => sum + Number(r.salaryEarned) || 0, 0).toFixed(2),
      totalNetSalary: formattedRecords.reduce((sum, r) => sum + Number(r.netSalary) || 0, 0).toFixed(2),
      totalDeductions: formattedRecords.reduce((sum, r) => sum + (Number(r.salaryEarned) * (Number(r.deductions) / 100)) || 0, 0).toFixed(2)
    };

    res.json({
      success: true,
      data: {
        employeeId: {
          employeeId: employee.employeeId,
          name: employee.name,
          designation: employee.designation,
          salary: employee.salary
        },
        records: formattedRecords,
        summary
      }
    });
  } catch (err) {
    console.error(`Error for employeeId ${req.params.employeeId}, range ${req.params.startDate} to ${endDate}:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

exports.notFound = (req, res) => {
  console.log(`Invalid route requested: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};