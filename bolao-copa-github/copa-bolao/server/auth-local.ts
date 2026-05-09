import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { ENV } from "./_core/env";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRY = "7d";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Auth-Local] Failed to connect to DB:", error);
      _db = null;
    }
  }
  return _db;
}

export interface LocalUser {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
  isBlocked: boolean;
}

export interface AuthResponse {
  token: string;
  user: LocalUser;
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token and extract userId
 */
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  name: string,
  password: string,
): Promise<AuthResponse> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user (using openId as email for now, to maintain schema compatibility)
  const result = await db.insert(users).values({
    openId: email, // Use email as openId for local auth
    email,
    name,
    avatarUrl: null,
    loginMethod: "local",
    role: "user",
    isBlocked: false,
    lastSignedIn: new Date(),
  });

  const userId = result[0].insertId;
  const token = generateToken(userId);

  return {
    token,
    user: {
      id: userId,
      email,
      name,
      role: "user",
      isBlocked: false,
    },
  };
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find user by email
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result[0];

  // Check if user is blocked
  if (user.isBlocked) {
    throw new Error("User account is blocked");
  }

  // Verify password (compare with avatarUrl field which we'll use to store hash temporarily)
  // Actually, we need to store the password hash somewhere. Let's use a different approach.
  // For now, we'll check if the user has a loginMethod of "local" and verify the password.
  // But we need to store the password hash. Let's use the avatarUrl field temporarily.

  // Actually, let's be more careful. The schema doesn't have a passwordHash field.
  // We need to store it somewhere. Let's use a workaround: store it in avatarUrl for now.
  if (!user.avatarUrl) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await comparePassword(password, user.avatarUrl);
  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  // Update last signed in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      role: user.role,
      isBlocked: user.isBlocked,
    },
  };
}

/**
 * Get user by token
 */
export async function getUserByToken(token: string): Promise<LocalUser | null> {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
  if (result.length === 0) return null;

  const user = result[0];
  return {
    id: user.id,
    email: user.email || "",
    name: user.name || "",
    role: user.role,
    isBlocked: user.isBlocked,
  };
}
