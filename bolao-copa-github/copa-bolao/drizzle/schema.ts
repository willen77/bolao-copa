import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Jogos da Copa do Mundo
 */
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  homeTeam: varchar("homeTeam", { length: 100 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 100 }).notNull(),
  homeFlag: varchar("homeFlag", { length: 10 }), // emoji da bandeira
  awayFlag: varchar("awayFlag", { length: 10 }), // emoji da bandeira
  homeScore: int("homeScore"), // null até ter resultado
  awayScore: int("awayScore"), // null até ter resultado
  matchDate: timestamp("matchDate").notNull(),
  phase: varchar("phase", { length: 100 }).default("Fase de Grupos").notNull(),
  stadium: varchar("stadium", { length: 200 }),
  status: mysqlEnum("status", ["upcoming", "live", "finished"]).default("upcoming").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Apostas dos usuários
 */
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameId: int("gameId").notNull(),
  homeScore: int("homeScore").notNull(),
  awayScore: int("awayScore").notNull(),
  points: int("points").default(0).notNull(), // 0, 1 ou 3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

/**
 * Ligas privadas
 */
export const leagues = mysqlTable("leagues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(), // código de convite
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type League = typeof leagues.$inferSelect;
export type InsertLeague = typeof leagues.$inferInsert;

/**
 * Membros de ligas privadas
 */
export const leagueMembers = mysqlTable("leagueMembers", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type LeagueMember = typeof leagueMembers.$inferSelect;
export type InsertLeagueMember = typeof leagueMembers.$inferInsert;
