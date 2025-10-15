/**
 * Node.js Admin Backend Server
 * Acts as gateway between React frontend and Python backend
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Configuration
const PORT = process.env.PORT || 5000;
const PYTHON_API = process.env.PYTHON_API || 'http://localhost:8000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let db;
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then(client => {
    db = client.db('smart_parking');
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check admin credentials
    const admin = await db.collection('admins').findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PROXY ROUTES TO PYTHON API
// ============================================

// Get system status
app.get('/api/status', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/status`);
    res.json(response.data);
  } catch (error) {
    console.error('Status error:', error.message);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Get all slots
app.get('/api/slots', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/slots`);
    res.json(response.data);
  } catch (error) {
    console.error('Slots error:', error.message);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Get active sessions
app.get('/api/sessions/active', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/sessions/active`);
    res.json(response.data);
  } catch (error) {
    console.error('Sessions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get user by RFID
app.get('/api/users/:rfid', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/users/${req.params.rfid}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.detail || 'Failed to fetch user' 
    });
  }
});

// Get wallet balance
app.get('/api/wallet/:rfid', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/wallet/${req.params.rfid}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.detail || 'Failed to fetch wallet' 
    });
  }
});

// ============================================
// DASHBOARD ANALYTICS
// ============================================

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [status, activeSessions] = await Promise.all([
      axios.get(`${PYTHON_API}/api/status`),
      axios.get(`${PYTHON_API}/api/sessions/active`)
    ]);

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenue = await db.collection('sessions').aggregate([
      {
        $match: {
          exit_time: { $gte: today },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount_charged' }
        }
      }
    ]).toArray();

    // Get total users
    const totalUsers = await db.collection('users').countDocuments();

    res.json({
      slots: {
        total: status.data.total_slots,
        occupied: status.data.occupied_slots,
        free: status.data.free_slots
      },
      sessions: {
        active: activeSessions.data.length
      },
      revenue: {
        today: todayRevenue[0]?.total || 0
      },
      users: {
        total: totalUsers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent transactions
app.get('/api/transactions/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = await db.collection('transactions')
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get revenue analytics
app.get('/api/analytics/revenue', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenue = await db.collection('sessions').aggregate([
      {
        $match: {
          exit_time: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$exit_time' } },
          revenue: { $sum: '$amount_charged' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(revenue);
  } catch (error) {
    console.error('Revenue analytics error:', error.message);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// ============================================
// WEBSOCKET FOR REAL-TIME UPDATES
// ============================================

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });

  // Join slot updates room
  socket.on('join:slots', () => {
    socket.join('slots');
    console.log('Client joined slots room');
  });

  // Join sessions room
  socket.on('join:sessions', () => {
    socket.join('sessions');
    console.log('Client joined sessions room');
  });
});

// Function to broadcast slot updates (called by MQTT listener)
function broadcastSlotUpdate(slotData) {
  io.to('slots').emit('slot:update', slotData);
}

// Function to broadcast session updates
function broadcastSessionUpdate(sessionData) {
  io.to('sessions').emit('session:update', sessionData);
}

// Export broadcast functions
module.exports = { broadcastSlotUpdate, broadcastSessionUpdate };

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 RFID Smart Parking - Admin Backend Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Python API: ${PYTHON_API}`);
  console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(60));
});
