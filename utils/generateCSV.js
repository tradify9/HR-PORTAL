const { Parser } = require('json2csv');

const generateCSV = (attendance) => {
  const fields = [
    { label: 'Employee ID', value: (row) => row.employeeId?.employeeId || '-' },
    { label: 'Name', value: (row) => row.employeeId?.name || '-' },
    { label: 'Email', value: (row) => row.employeeId?.email || '-' },
    { label: 'Date', value: (row) => new Date(row.date).toLocaleDateString('en-IN') },
    { label: 'Punch In', value: (row) => (row.punchIn ? new Date(row.punchIn).toLocaleTimeString('en-IN') : '-') },
    { label: 'Punch Out', value: (row) => (row.punchOut ? new Date(row.punchOut).toLocaleTimeString('en-IN') : '-') },
  ];
  const opts = { fields, excelStrings: true };
  const parser = new Parser(opts);
  return parser.parse(attendance);
};

module.exports = { generateCSV };