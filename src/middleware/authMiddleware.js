import { getDb } from '../db/database.js';
import { generateId } from '../services/cryptoService.js';
import { config } from '../config.js';

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

export function authMiddleware(req, res, next) {
  const db = getDb();
  let token = req.cookies?.sid;

  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (token) {
    const session = db
      .prepare('SELECT s.*, u.email, u.display_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?')
      .get(token);

    if (session && session.expires_at > Date.now()) {
      req.user = {
        id: session.user_id,
        email: session.email,
        displayName: session.display_name
      };
      req.sessionId = session.id;
      return next();
    }
  }

  const defaultUser = db.prepare('SELECT * FROM users WHERE email = ?').get('guest@optimizer.local');
  let user = defaultUser;

  if (!user) {
    const newUserId = generateId();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
      newUserId,
      'guest@optimizer.local',
      'Workspace Member',
      now,
      now
    );

    db.prepare('INSERT INTO profiles (id, user_id, updated_at) VALUES (?, ?, ?)').run(generateId(), newUserId, now);

    user = { id: newUserId, email: 'guest@optimizer.local', display_name: 'Workspace Member' };
  }

  const newSessionId = generateId();
  const expiresAt = Date.now() + config.sessionMaxAgeMs;
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    newSessionId,
    user.id,
    expiresAt,
    new Date().toISOString()
  );

  res.cookie('sid', newSessionId, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: config.sessionMaxAgeMs
  });

  req.user = {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  };
  req.sessionId = newSessionId;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
