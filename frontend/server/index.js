require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const narrationRoutes = require('./routes/narrations');
const caseRoutes = require('./routes/cases');
const sketchRoutes = require('./routes/sketches');
const meshRoutes = require('./routes/meshes');
const dashboardRoutes = require('./routes/dashboard');
const mlRoutes = require('./routes/ml');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React static files
app.use(express.static(path.join(__dirname, '../client/public')));

// Routes
app.use('/api/narrations', narrationRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/sketches', sketchRoutes);
app.use('/api/meshes', meshRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'Identif.ai API' });
});

// Catch-all route for React routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🔍 Identif.ai Server running on port ${PORT}\n`);
});

// Set timeout for long-running ML operations (10 minutes)
server.timeout = 600000;
server.keepAliveTimeout = 120000;
