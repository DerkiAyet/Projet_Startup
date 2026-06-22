const { Server } = require('socket.io');
require('dotenv').config({ path: './config.env' });


let io = null;
const connectedUsers = {};
const activeConversations = {}; // to track the active conversations

function setupWebSocket(server) {
  io = new Server(server, {
    path: '/socket.io',  // to access the socket
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000 // 2 minutes
    }
  });

  console.log("✅ WebSocket server initialized");

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Nouveau : Room spéciale pour les admins
    socket.on("register_admin", () => {
      socket.join('admin_room');
      console.log(`Admin registered in admin_room: ${socket.id}`);
    });

    // When user connects, they send their userId and role
    socket.on("register", ({ userId, userRole }) => {
      console.log(`User connected through WebSocket: ID=${userId}, role=${userRole}, socketId=${socket.id}`);
      connectedUsers[userId] = { socketId: socket.id, role: userRole };

      // Chaque user rejoint sa propre room personnelle pour les notifications broadcast (la plus importante)
      socket.join(`user:${userId}`);
    });

    // ── Messaging rooms ──────────────────────────────────────────
    socket.on('open_conversation', ({ conversationId }) => {
      // find userId by socketId
      const userId = Object.keys(connectedUsers).find(
        id => connectedUsers[id].socketId === socket.id // what's important is the socket.id
      );
      if (!userId) return;

      activeConversations[userId] = conversationId;
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} opened conversation ${conversationId}`);
    });

    socket.on('close_conversation', ({ conversationId }) => {
      const userId = Object.keys(connectedUsers).find(
        id => connectedUsers[id].socketId === socket.id
      );
      if (!userId) return;

      delete activeConversations[userId];
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} closed conversation ${conversationId}`);
    });

    // ── Typing indicators ────────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      const userId = Object.keys(connectedUsers).find(
        id => connectedUsers[id].socketId === socket.id
      );
      // broadcast to everyone in the conversation except the typer
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        conversationId
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      const userId = Object.keys(connectedUsers).find(
        id => connectedUsers[id].socketId === socket.id
      );
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId,
        conversationId
      });
    });


    socket.on('join_classroom', ({ classroomId }) => {
      socket.join(`classroom:${classroomId}`);
      console.log(`Socket ${socket.id} joined classroom:${classroomId}`);
    });

    socket.on('leave_classroom', ({ classroomId }) => {
      socket.leave(`classroom:${classroomId}`);
    }); // exactement hada li nsst7a9eh, tma 5ssni ghi join_session w leave session

    // ── Collaborative session (assignment) ───────────────────────

    socket.on('join_session', ({ sessionId }) => {
      socket.join(`session:${sessionId}`);
      console.log(`Socket ${socket.id} joined session:${sessionId}`);
    });

    socket.on('leave_session', ({ sessionId }) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('session:phase_change', ({ sessionId, phase }) => {
      io.to(`session:${sessionId}`).emit('session:phase_updated', {
        sessionId,
        phase
      });
    });// hadou kima darou ma yjouch hna, ana fhamti kanet m3a9ssa sara7a

    socket.on('consensus:lock', ({ sessionId, exerciseId, userId }) => {
      io.to(`session:${sessionId}`).emit('consensus:locked', {
        sessionId,
        exerciseId,
        lockedBy: userId
      });
    });  // hadou kima darou ma yjouch hna, ana fhamti kanet m3a9ssa sara7a

    socket.on('consensus:typing', ({ sessionId, exerciseId, text, userId }) => {
      socket.to(`session:${sessionId}`).emit('consensus:updated', {
        sessionId,
        exerciseId,
        text,
        updatedBy: userId
      });
    }); //wla hada

    socket.on('consensus:unlock', ({ sessionId, exerciseId }) => {
      io.to(`session:${sessionId}`).emit('consensus:unlocked', {
        sessionId,
        exerciseId
      });
    });

    // Student submitted their individual sheet
    socket.on('session:sheet_submitted', ({ sessionId, userId }) => {
      socket.to(`session:${sessionId}`).emit('session:student_submitted', {
        sessionId,
        userId
      });
    }); // hadou kima darou ma yjouch hna, ana fhamti kanet m3a9ssa sara7a... m3lich n5alihm souvenir

    // for the gamification service:
     socket.on('join_game', ({ userId }) => {
      socket.join(`gamification:${userId}`);
      console.log(`Socket ${socket.id} joined in game system:${userId}`);
    });

    socket.on('leave_game', ({ userId }) => { 
      socket.leave(`gamification:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      for (const [userId, info] of Object.entries(connectedUsers)) {
        if (info.socketId === socket.id) {
          delete connectedUsers[userId];
          break;
        }
      }
    });
  });
}

function sendNotification(receiverId, data) {
  if (connectedUsers[receiverId]) {
    io.to(connectedUsers[receiverId].socketId).emit('user_notification', data);
  }
}

function sendRoleNotification(role, data) {
  if (!io) throw new Error("WebSocket server not initialized");
  io.to(role).emit('role_notification', data);
}

function sendBroadcastNotification(userId, data) {
  if (!io) throw new Error("WebSocket server not initialized");
  io.to(`user:${userId}`).emit('user_notification', data);
  console.log("notification sent")
}

// Nouvelle fonction pour les notifications système
function sendSystemNotification(data) {
  if (!io) throw new Error("WebSocket server not initialized");
  io.to('admin_room').emit('system_notification', {
    ...data,
    isSystem: true,
    timestamp: new Date()
  });
}

function sendClassroomEvent(classroomId, event, data) {
  if (!io) throw new Error("WebSocket server not initialized");
  io.to(`classroom:${classroomId}`).emit(event, data);
}

function sendSessionEvent(sessionId, event, data) {
  if (!io) throw new Error("WebSocket server not initialized");
  io.to(`session:${sessionId}`).emit(event, data);
}


module.exports = {
  setupWebSocket,
  sendNotification,
  sendRoleNotification,
  sendBroadcastNotification,
  sendSystemNotification,
  sendClassroomEvent,
  sendSessionEvent,
  getIO: () => io,
  getActiveConversations: () => activeConversations,
  getConnectedUsers: () => connectedUsers
};