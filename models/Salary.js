const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  allowances: {
    hra: { type: Number, default: 0 },
    travel: { type: Number, default: 0 },
  },
  deductions: {
    absent: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
  },
  netSalary: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Salary', salarySchema);