import { trpc } from "@/lib/trpc";
import { useAuth } from "./use-auth";

/**
 * Returns the full user object from the database (including role, isBlocked, avatarUrl).
 * Falls back to the auth user for basic info when the DB query is loading.
 */
export function useCurrentUser() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const { data: dbUser, isLoading: dbLoading, refetch } = trpc.users.me.useQuery(undefined, {
    enabled: !!authUser,
    staleTime: 30_000,
  });

  const isAdmin = dbUser?.role === "admin";
  const isLoading = authLoading || (!!authUser && dbLoading);

  return {
    user: dbUser ?? null,
    authUser,
    isAdmin,
    isLoading,
    logout,
    refetch,
  };
}
