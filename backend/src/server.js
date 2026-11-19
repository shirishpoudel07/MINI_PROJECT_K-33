import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import patientRoutes from './routes/patientRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import prisma from './prisma.js';
import { scheduleDoctorAutoReply } from './controllers/messageController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with permissive CORS for local dev
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Pass Socket.IO instance to Express app
app.set('io', io);

// Socket.io real-time connection logic
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join patient private room
  socket.on('joinRoom', (patientId) => {
    socket.join(`patient-${patientId}`);
    console.log(`👤 Client ${socket.id} joined private room patient-${patientId}`);
  });

  socket.on('join_patient_room', (patientId) => {
    socket.join(`patient-${patientId}`);
  });

  socket.on('joinTherapistRoom', (_therapistId = 'therapist') => {
    socket.join('therapist-room');
    console.log(`🩺 Therapist ${socket.id} joined therapist-room`);
  });

  // Real-Time Chat Data Flow: Writes to Database table first, then broadcasts to rooms
  socket.on('sendMessage', async (data) => {
    try {
      const patientId = data.patient_id || data.patientId;
      const senderId = data.sender_id || data.sender || 'patient';
      const receiverId = data.receiver_id || (senderId === 'doctor' ? patientId : 'doctor');
      const messageText = (data.message_text || data.text || '').trim();
      const messageId = data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Deduplication guard 1: Check by message ID
      const existingById = await prisma.message.findUnique({ where: { id: messageId } });
      if (existingById) return;

      // Deduplication guard 2: Check by content, sender, and recency (within 4 seconds)
      const existingContent = await prisma.message.findFirst({
        where: {
          patientId,
          sender: senderId === 'doctor' ? 'doctor' : 'patient',
          text: messageText,
          createdAt: { gte: new Date(Date.now() - 4000) }
        }
      });
      if (existingContent) return;

      // 1. Write to database table first
      const savedMessage = await prisma.message.create({
        data: {
          id: messageId,
          patientId,
          sender: senderId === 'doctor' ? 'doctor' : 'patient',
          sender_id: senderId,
          receiver_id: receiverId,
          text: messageText,
          message_text: messageText,
          videoUrl: data.videoUrl || null,
          thumbnail: data.thumbnail || null,
          title: data.title || null,
          timestamp: readableTime
        }
      });

      // 2. Broadcast cleanly to rooms
      io.to(`patient-${patientId}`).emit('new_message', savedMessage);
      io.to('therapist-room').emit('new_message', savedMessage);
      io.emit('global_message', { patientId, message: savedMessage });

      // 3. Create real clinical notification if patient messages therapist
      if (senderId !== 'doctor') {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (patient) {
          const notification = await prisma.notification.create({
            data: {
              id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              patientId,
              patientName: patient.name,
              patientCondition: patient.condition,
              title: 'New Patient Question',
              message: `"${messageText.slice(0, 80)}"`,
              type: 'message',
              time: 'Just now',
              isUnread: true
            }
          });
          io.emit('new_notification', notification);

          // Schedule real-time automated clinical doctor response
          scheduleDoctorAutoReply(io, patientId, messageText, patient.condition);
        }
      }
    } catch (err) {
      console.error('Socket sendMessage error:', err);
      socket.emit('message_error', { error: 'Failed to deliver message' });
    }
  });

  // Real-time Live Typing Indicators
  socket.on('typing', ({ patientId, sender, name }) => {
    socket.to(`patient-${patientId}`).emit('user_typing', { patientId, sender, name });
    socket.to('therapist-room').emit('user_typing', { patientId, sender, name });
  });

  socket.on('stop_typing', ({ patientId, sender }) => {
    socket.to(`patient-${patientId}`).emit('user_stop_typing', { patientId, sender });
    socket.to('therapist-room').emit('user_stop_typing', { patientId, sender });
  });

  // Real-time Plan Assigned Notification relay with first video thumbnail
  socket.on('plan_assigned_notification', (data) => {
    const patientId = data.patientId || data.patient_id;
    if (patientId) {
      io.to(`patient-${patientId}`).emit('plan_assigned_notification', data);
      io.to('therapist-room').emit('plan_assigned_notification', data);
      io.emit('global_plan_notification', data);
    }
  });

  socket.on('leave_patient_room', (patientId) => {
    socket.leave(`patient-${patientId}`);
    console.log(`👋 Client ${socket.id} left room patient-${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VirtuHeal Clinical Backend API'
  });
});

// Mount Routes
app.use('/api/patients', patientRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/notifications', notificationRoutes);

// Global 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT IN USE] Port ${PORT} is already in use by another process.`);
    console.error(`👉 VirtuHeal API Server is already running on port ${PORT}.`);
    console.error(`   To free port ${PORT} on Windows, close the other terminal or run:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
    process.exit(1);
  } else {
    console.error('Unhandled server error during startup:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 VirtuHeal API Server is running on http://localhost:${PORT}`);
});
