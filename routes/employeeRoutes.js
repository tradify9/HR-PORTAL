const express = require('express');
const router = express.Router();
const { login, getProfile, requestLeave, getSalarySlip } = require('../controllers/employeeController');
const auth = require('../middleware/auth');


router.post('/login', login);
router.get('/profile', auth('employee'), getProfile);
router.post('/leave', auth('employee'), requestLeave);
router.get('/salary-slip', auth('employee'), getSalarySlip);

module.exports = router;