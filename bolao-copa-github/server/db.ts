import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ─── Additional imports for bolão features ────────────────────────────────────
import { and, desc, sql } from "drizzle-orm";
import {
  bets,
  games,
  leagueMembers,
  leagues,
  type InsertBet,
  type InsertGame,
  type InsertLeague,
} from "../drizzle/schema";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateUserAvatar(userId: number, avatarUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
}

export async function blockUser(userId: number, isBlocked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isBlocked }).where(eq(users.id, userId));
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function getAllGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).orderBy(games.matchDate);
}

export async function getGameById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createGame(data: InsertGame) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(games).values(data);
  return result[0].insertId;
}

export async function updateGame(id: number, data: Partial<InsertGame>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(games).set(data).where(eq(games.id, id));
}

export async function setGameResult(id: number, homeScore: number, awayScore: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(games).set({ homeScore, awayScore, status: "finished" }).where(eq(games.id, id));
  await calculateBetsForGame(id, homeScore, awayScore);
}

export async function setGameStatus(id: number, status: "upcoming" | "live" | "finished") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(games).set({ status }).where(eq(games.id, id));
}

export async function deleteGame(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bets).where(eq(bets.gameId, id));
  await db.delete(games).where(eq(games.id, id));
}

// ─── Bets ─────────────────────────────────────────────────────────────────────

export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      bet: bets,
      game: games,
    })
    .from(bets)
    .innerJoin(games, eq(bets.gameId, games.id))
    .where(eq(bets.userId, userId))
    .orderBy(desc(games.matchDate));
}

export async function getBetByUserAndGame(userId: number, gameId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(bets)
    .where(and(eq(bets.userId, userId), eq(bets.gameId, gameId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createOrUpdateBet(data: InsertBet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBetByUserAndGame(data.userId, data.gameId);
  if (existing) {
    await db
      .update(bets)
      .set({ homeScore: data.homeScore, awayScore: data.awayScore })
      .where(eq(bets.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(bets).values(data);
  return result[0].insertId;
}

export async function getAllBetsForGame(gameId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(eq(bets.gameId, gameId));
}

function calculatePoints(betHome: number, betAway: number, realHome: number, realAway: number): number {
  if (betHome === realHome && betAway === realAway) return 3;
  const betResult = Math.sign(betHome - betAway);
  const realResult = Math.sign(realHome - realAway);
  if (betResult === realResult) return 1;
  return 0;
}

async function calculateBetsForGame(gameId: number, realHome: number, realAway: number) {
  const db = await getDb();
  if (!db) return;
  const gameBets = await getAllBetsForGame(gameId);
  for (const bet of gameBets) {
    const points = calculatePoints(bet.homeScore, bet.awayScore, realHome, realAway);
    await db.update(bets).set({ points }).where(eq(bets.id, bet.id));
  }
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export async function getGlobalRanking() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      userId: bets.userId,
      totalPoints: sql<number>`COALESCE(SUM(${bets.points}), 0)`,
      exactScores: sql<number>`SUM(CASE WHEN ${bets.points} = 3 THEN 1 ELSE 0 END)`,
      correctResults: sql<number>`SUM(CASE WHEN ${bets.points} = 1 THEN 1 ELSE 0 END)`,
      totalBets: sql<number>`COUNT(${bets.id})`,
    })
    .from(bets)
    .groupBy(bets.userId)
    .orderBy(desc(sql`SUM(${bets.points})`));

  if (result.length === 0) return [];

  const userIds = result.map((r) => r.userId);
  const userList = await db
    .select()
    .from(users)
    .where(sql`${users.id} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`);
  const userMap = new Map(userList.map((u) => [u.id, u]));

  return result
    .filter((r) => {
      const u = userMap.get(r.userId);
      return u && !u.isBlocked;
    })
    .map((r, index) => ({
      position: index + 1,
      user: userMap.get(r.userId)!,
      totalPoints: Number(r.totalPoints) ?? 0,
      exactScores: Number(r.exactScores) ?? 0,
      correctResults: Number(r.correctResults) ?? 0,
      totalBets: Number(r.totalBets) ?? 0,
    }));
}

export async function getLeagueRanking(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db
    .select({ userId: leagueMembers.userId })
    .from(leagueMembers)
    .where(eq(leagueMembers.leagueId, leagueId));

  if (members.length === 0) return [];
  const memberIds = members.map((m) => m.userId);

  const result = await db
    .select({
      userId: bets.userId,
      totalPoints: sql<number>`COALESCE(SUM(${bets.points}), 0)`,
      exactScores: sql<number>`SUM(CASE WHEN ${bets.points} = 3 THEN 1 ELSE 0 END)`,
      correctResults: sql<number>`SUM(CASE WHEN ${bets.points} = 1 THEN 1 ELSE 0 END)`,
      totalBets: sql<number>`COUNT(${bets.id})`,
    })
    .from(bets)
    .where(sql`${bets.userId} IN (${sql.join(memberIds.map((id) => sql`${id}`), sql`, `)})`)
    .groupBy(bets.userId)
    .orderBy(desc(sql`SUM(${bets.points})`));

  const userList = await db
    .select()
    .from(users)
    .where(sql`${users.id} IN (${sql.join(memberIds.map((id) => sql`${id}`), sql`, `)})`);
  const userMap = new Map(userList.map((u) => [u.id, u]));

  const rankedIds = new Set(result.map((r) => r.userId));
  const zeroUsers = memberIds.filter((id) => !rankedIds.has(id));

  const allResults = [
    ...result.map((r, index) => ({
      position: index + 1,
      user: userMap.get(r.userId)!,
      totalPoints: Number(r.totalPoints) ?? 0,
      exactScores: Number(r.exactScores) ?? 0,
      correctResults: Number(r.correctResults) ?? 0,
      totalBets: Number(r.totalBets) ?? 0,
    })),
    ...zeroUsers.map((id, i) => ({
      position: result.length + i + 1,
      user: userMap.get(id)!,
      totalPoints: 0,
      exactScores: 0,
      correctResults: 0,
      totalBets: 0,
    })),
  ].filter((r) => r.user);

  return allResults;
}

// ─── Leagues ──────────────────────────────────────────────────────────────────

export async function getAllLeagues() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leagues).orderBy(desc(leagues.createdAt));
}

export async function getLeagueByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leagues).where(eq(leagues.code, code)).limit(1);
  return result[0] ?? null;
}

export async function getLeagueById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leagues).where(eq(leagues.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserLeagues(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ league: leagues })
    .from(leagueMembers)
    .innerJoin(leagues, eq(leagueMembers.leagueId, leagues.id))
    .where(eq(leagueMembers.userId, userId));
}

export async function createLeague(data: InsertLeague) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leagues).values(data);
  await db.insert(leagueMembers).values({ leagueId: result[0].insertId, userId: data.createdBy });
  return result[0].insertId;
}

export async function joinLeague(leagueId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(leagueMembers)
    .where(and(eq(leagueMembers.leagueId, leagueId), eq(leagueMembers.userId, userId)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(leagueMembers).values({ leagueId, userId });
}

export async function deleteLeague(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leagueMembers).where(eq(leagueMembers.leagueId, id));
  await db.delete(leagues).where(eq(leagues.id, id));
}

export async function getLeagueMembers(leagueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ user: users })
    .from(leagueMembers)
    .innerJoin(users, eq(leagueMembers.userId, users.id))
    .where(eq(leagueMembers.leagueId, leagueId));
}
