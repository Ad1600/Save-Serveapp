require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectDB = require('./config/db');
const Offre = require('./models/Offre');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: process.env.SESSION_SECRET || 'saveandserve_session_2025',
  resave: false, saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Ensure uploads folder exists and serve it statically for temporary files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Make io accessible in routes
app.set('io', io);

// Socket.io
const connectedUsers = {};

const resolveRoleRoom = (role, userId) => {
  if (role === 'admin') return 'admin_room';
  if (role === 'commercant' || role === 'seller') return `seller_${userId}`;
  return `user_${userId}`;
};

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    if (data.userId) {
      connectedUsers[data.userId] = socket.id;
      socket.join(data.userId);
      socket.join(data.role);

      const roleRoom = data.room || resolveRoleRoom(data.role, data.userId);
      socket.join(roleRoom);
    }
  });

  socket.on('joinRoom', (data) => {
    if (data?.room) {
      socket.join(data.room);
    }
  });

  socket.on('disconnect', () => {
    Object.keys(connectedUsers).forEach(uid => {
      if (connectedUsers[uid] === socket.id) delete connectedUsers[uid];
    });
  });
});

// Helper to emit to a user
const emitToUser = (userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};
app.set('emitToUser', emitToUser);

const emitToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
};
app.set('emitToRoom', emitToRoom);

// Google OAuth
try {
  const { passport } = require('./config/google-auth');
  app.use(passport.initialize());
  app.use(passport.session());
  const { genToken } = require('./config/google-auth');
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/test-interface.html?error=google_auth_failed' }),
    (req, res) => {
      const token = genToken(req.user._id);
      const user = { _id: req.user._id, nom: req.user.nom, email: req.user.email, role: req.user.role, telephone: req.user.telephone, adresse: req.user.adresse, nomCommerce: req.user.nomCommerce, adresseCommerce: req.user.adresseCommerce, latitude: req.user.latitude, longitude: req.user.longitude, token };
      res.redirect('/test-interface.html?google_user=' + encodeURIComponent(JSON.stringify(user)));
    }
  );
} catch(e) { console.log('Google OAuth not configured:', e.message); }

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/offres',    require('./routes/offres'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/debug',     require('./routes/debug'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/vendeur',   require('./routes/vendeur'));
app.use('/api/avis',      require('./routes/avis'));
app.use('/api/bons',      require('./routes/bons'));
app.use('/api/support',   require('./routes/support'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'test-interface.html')));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvee' }));

// ── Weekly Recurrence Scheduler ───────────────────────────────────────────────
// Runs every hour to republish expired offers that have recurrence = 'hebdomadaire'
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const expiredWeekly = await Offre.find({
      recurrence: 'hebdomadaire',
      $or: [
        { dateExpiration: { $lt: now } },
        { quantiteDisponible: 0 },
      ],
    });

    if (expiredWeekly.length === 0) return;

    for (const offre of expiredWeekly) {
      const originalQty = offre.quantiteInitiale || offre.quantiteDisponible || 1;

      // Advance expiration by 7-day steps until it is in the future
      const newExpiration = new Date(offre.dateExpiration);
      while (newExpiration <= now) {
        newExpiration.setDate(newExpiration.getDate() + 7);
      }

      await Offre.findByIdAndUpdate(offre._id, {
        $set: {
          quantiteDisponible: originalQty,
          dateExpiration: newExpiration,
          active: true,
          statut: 'disponible',
          dernierePublication: now,
        },
      });
    }

    console.log(`[Cron] Republished ${expiredWeekly.length} weekly offer(s)`);
  } catch (e) {
    console.error('[Cron] Weekly republication error:', e.message);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur demarre sur http://localhost:${PORT}`));
module.exports = { app, io };
