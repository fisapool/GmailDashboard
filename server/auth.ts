import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import session from 'express-session';
import FileStore from 'session-file-store';
import { storage } from './storage';

// Declare module to extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const SessionFileStore = FileStore(session);

// Encryption key setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_IV = crypto.randomBytes(16);

// Helper function to encrypt sensitive data
export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), ENCRYPTION_IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted + ':' + ENCRYPTION_IV.toString('hex');
}

// Helper function to decrypt sensitive data
export function decrypt(text: string): string {
  const [encryptedText, ivHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Session middleware configuration
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'gmail-account-manager-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
    path: '/'
  },
  store: new SessionFileStore({
    path: './sessions',
    ttl: 86400,
    reapInterval: 3600
  })
});

// Auth middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Login user
export async function loginUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return { id: user.id, username: user.username, email: user.email, name: user.name };
}

// Register user
export async function registerUser(username: string, password: string, email: string, name?: string) {
  // Check if username already exists
  const existingUsername = await storage.getUserByUsername(username);
  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Check if email already exists
  const existingEmail = await storage.getUserByEmail(email);
  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await storage.createUser({
    username,
    password: hashedPassword,
    email,
    name
  });

  return { id: user.id, username: user.username, email: user.email, name: user.name };
}