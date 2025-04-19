const express = require('express');
const config = require('./config');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan'); // For HTTP request logging
const { errorHandler } = require('./middleware/errorMiddleware'); // Custom error handler
const fs = require('fs');

// Connect to MongoDB Atlas
mongoose.connect(config.mongodbUri, {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
}).then(() => console.log(`MongoDB connected to ${config.mongodbUri.split('@')[1].split('/')[0]}`))
  .catch(err => console.log('MongoDB connection error:', err));

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(morgan('combined')); // Log all requests

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/employee', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));

// Serve Frontend Build for Live Site with Error Handling
app.use(express.static(path.join(__dirname, 'public/build')));
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public/build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ status: 'error', message: 'Frontend build not found' });
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running', uptime: process.uptime() });
});

// Error Handling Middleware
app.use(errorHandler);

// Start Server with Live Configuration and Port Conflict Handling
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port or free it up.`);
    process.exit(1);
  }
});

// Handle unhandled promise rejections (e.g., MongoDB connection issues)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection at: ${promise}, reason: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown for live server
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});