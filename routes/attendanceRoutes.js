const express = require('express');
const router = express.Router();
const { punchIn, punchOut, getAttendance } = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.post('/punch-in', auth('employee'), punchIn);
router.post('/punch-out', auth('employee'), punchOut);
router.get('/', auth('employee'), getAttendance);

module.exports = router;