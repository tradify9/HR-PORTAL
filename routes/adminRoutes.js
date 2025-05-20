const express = require('express');
const router = express.Router();
const {
  login,
  addEmployee,
  editEmployee,
  deleteEmployee,
  uploadCSV,
  getEmployees,
  getAttendance,
  downloadAttendance,
  getLeaveRequests,
  updateLeaveStatus,
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const parser = require('../middleware/cloudinaryStorage');

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      cb(null, 'uploads/photos/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post('/login', login);
router.post('/employee', auth('admin'), parser.single('photo'), addEmployee);
router.put('/employee/:id', auth('admin'), parser.single('photo'), editEmployee);
router.delete('/employee/:id', auth('admin'), deleteEmployee);
router.post('/upload-csv', auth('admin'), upload.single('csv'), uploadCSV);
router.get('/employees', auth('admin'), getEmployees);
router.get('/attendance', auth('admin'), getAttendance);
router.get('/attendance/download', auth('admin'), downloadAttendance);
router.get('/leaves', auth('admin'), getLeaveRequests);
router.put('/leaves', auth('admin'), updateLeaveStatus);

module.exports = router;