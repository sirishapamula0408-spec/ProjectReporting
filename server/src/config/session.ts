import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const PgSession = connectPgSimple(session);

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

// Parse DATABASE_URL into explicit params for pg.Pool
const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/prt');
const sessionPool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432', 10),
  database: dbUrl.pathname.slice(1),
  user: String(decodeURIComponent(dbUrl.username)),
  password: String(decodeURIComponent(dbUrl.password)),
});

export const sessionMiddleware = session({
  store: new PgSession({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: EIGHT_HOURS_MS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  name: 'prt.sid',
});
