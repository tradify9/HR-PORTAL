const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/attendance/:employeeId/:date', salaryController.calculateSalary);
router.get('/attendance/:employeeId/range/:startDate/:endDate', salaryController.calculateSalaryRange);



module.exports = router;