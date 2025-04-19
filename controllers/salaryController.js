const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

exports.calculateSalary = async (employeeId, month) => {
  const startOfMonth = moment(month, 'YYYY-MM').startOf('month').toDate();
  const endOfMonth = moment(month, 'YYYY-MM').endOf('month').toDate();

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const attendance = await Attendance.find({
    employeeId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const workingDays = moment(month, 'YYYY-MM').daysInMonth();
  const presentDays = attendance.length;
  const absentDays = workingDays - presentDays;

  const baseSalary = employee.salary;
  const allowances = {
    hra: baseSalary * 0.2,
    travel: baseSalary * 0.1,
  };
  const deductions = {
    absent: absentDays * 1000,
    tax: baseSalary * 0.1,
  };
  const totalAllowances = allowances.hra + allowances.travel;
  const totalDeductions = deductions.absent + deductions.tax;
  const netSalary = baseSalary + totalAllowances - totalDeductions;

  return {
    baseSalary,
    allowances,
    deductions,
    netSalary,
  };
};