import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as authLocal from "./auth-local";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Local authentication (email + password)
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1).max(200),
          password: z.string().min(6),
        }),
      )
      .mutation(async ({ input }) => {
        return authLocal.registerUser(input.email, input.name, input.password);
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return authLocal.loginUser(input.email, input.password);
      }),

    verifyToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const user = await authLocal.getUserByToken(input.token);
        if (!user) throw new Error("Invalid token");
        return user;
      }),
  }),

  // ─── Users ──────────────────────────────────────────────────────────────────
  users: router({
    me: protectedProcedure.query(({ ctx }) => db.getUserById(ctx.user.id)),

    updateAvatar: protectedProcedure
      .input(z.object({ avatarUrl: z.string().url() }))
      .mutation(({ ctx, input }) => db.updateUserAvatar(ctx.user.id, input.avatarUrl)),

    // Admin only
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      return db.getAllUsers();
    }),

    block: protectedProcedure
      .input(z.object({ userId: z.number(), isBlocked: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.blockUser(input.userId, input.isBlocked);
      }),

    setRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.setUserRole(input.userId, input.role);
      }),
  }),

  // ─── Games ──────────────────────────────────────────────────────────────────
  games: router({
    list: publicProcedure.query(() => db.getAllGames()),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getGameById(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          homeTeam: z.string().min(1).max(100),
          awayTeam: z.string().min(1).max(100),
          homeFlag: z.string().max(10).optional(),
          awayFlag: z.string().max(10).optional(),
          matchDate: z.string(), // ISO string
          phase: z.string().max(100).optional(),
          stadium: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.createGame({
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          homeFlag: input.homeFlag,
          awayFlag: input.awayFlag,
          matchDate: new Date(input.matchDate),
          phase: input.phase ?? "Fase de Grupos",
          stadium: input.stadium,
          status: "upcoming",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          homeTeam: z.string().min(1).max(100).optional(),
          awayTeam: z.string().min(1).max(100).optional(),
          homeFlag: z.string().max(10).optional(),
          awayFlag: z.string().max(10).optional(),
          matchDate: z.string().optional(),
          phase: z.string().max(100).optional(),
          stadium: z.string().max(200).optional(),
          status: z.enum(["upcoming", "live", "finished"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        const { id, matchDate, ...rest } = input;
        return db.updateGame(id, {
          ...rest,
          ...(matchDate ? { matchDate: new Date(matchDate) } : {}),
        });
      }),

    setResult: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          homeScore: z.number().int().min(0),
          awayScore: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.setGameResult(input.id, input.homeScore, input.awayScore);
      }),

    setStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["upcoming", "live", "finished"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.setGameStatus(input.id, input.status);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.deleteGame(input.id);
      }),
  }),

  // ─── Bets ────────────────────────────────────────────────────────────────────
  bets: router({
    myBets: protectedProcedure.query(({ ctx }) => db.getUserBets(ctx.user.id)),

    getBetForGame: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .query(({ ctx, input }) => db.getBetByUserAndGame(ctx.user.id, input.gameId)),

    placeBet: protectedProcedure
      .input(
        z.object({
          gameId: z.number(),
          homeScore: z.number().int().min(0),
          awayScore: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verificar se o jogo ainda está aberto
        const game = await db.getGameById(input.gameId);
        if (!game) throw new Error("Jogo não encontrado");
        if (game.status !== "upcoming") throw new Error("Este jogo não aceita mais apostas");
        return db.createOrUpdateBet({
          userId: ctx.user.id,
          gameId: input.gameId,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          points: 0,
        });
      }),
  }),

  // ─── Ranking ─────────────────────────────────────────────────────────────────
  ranking: router({
    global: publicProcedure.query(() => db.getGlobalRanking()),

    league: protectedProcedure
      .input(z.object({ leagueId: z.number() }))
      .query(({ input }) => db.getLeagueRanking(input.leagueId)),
  }),

  // ─── Leagues ─────────────────────────────────────────────────────────────────
  leagues: router({
    myLeagues: protectedProcedure.query(({ ctx }) => db.getUserLeagues(ctx.user.id)),

    all: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
      return db.getAllLeagues();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getLeagueById(input.id)),

    members: protectedProcedure
      .input(z.object({ leagueId: z.number() }))
      .query(({ input }) => db.getLeagueMembers(input.leagueId)),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(200),
          description: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        // Gerar código aleatório de 6 caracteres
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        return db.createLeague({
          name: input.name,
          description: input.description,
          code,
          createdBy: ctx.user.id,
        });
      }),

    join: protectedProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const league = await db.getLeagueByCode(input.code.toUpperCase());
        if (!league) throw new Error("Liga não encontrada. Verifique o código.");
        await db.joinLeague(league.id, ctx.user.id);
        return league;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
        return db.deleteLeague(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
