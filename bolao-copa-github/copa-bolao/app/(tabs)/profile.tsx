import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Image } from "expo-image";

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <View className="flex-1 bg-surface rounded-xl p-3 items-center border border-border">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="text-xl font-bold text-foreground mt-1">{value}</Text>
      <Text className="text-xs text-muted text-center mt-0.5">{label}</Text>
    </View>
  );
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ProfileScreen() {
  const { user, logout, refetch: refetchUser } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const { data: myBets, isLoading, refetch: refetchBets } = trpc.bets.myBets.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: ranking } = trpc.ranking.global.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchBets()]);
    setRefreshing(false);
  }, [refetchUser, refetchBets]);

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  };

  const myPosition = ranking?.findIndex((r) => r.user.id === user?.id);
  const myRankEntry = myPosition !== undefined && myPosition >= 0 ? ranking?.[myPosition] : null;

  const totalPoints = myRankEntry?.totalPoints ?? 0;
  const exactScores = myRankEntry?.exactScores ?? 0;
  const correctResults = myRankEntry?.correctResults ?? 0;
  const totalBets = myBets?.length ?? 0;

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScreenContainer containerClassName="bg-background">
      <FlatList
        data={myBets ?? []}
        keyExtractor={(item) => item.bet.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6B3C" />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="px-4 pt-4 pb-2">
              <Text className="text-2xl font-bold text-foreground">👤 Perfil</Text>
            </View>

            {/* Avatar e info */}
            <View className="mx-4 mt-2 bg-surface rounded-2xl p-5 border border-border items-center">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
                  <Text className="text-white text-3xl font-bold">{initials}</Text>
                </View>
              )}
              <Text className="text-xl font-bold text-foreground mt-3">
                {user?.name ?? "Usuário"}
              </Text>
              <Text className="text-sm text-muted mt-0.5">{user?.email ?? ""}</Text>
              {user?.role === "admin" && (
                <View className="mt-2 bg-primary/10 rounded-full px-3 py-1">
                  <Text className="text-primary text-xs font-bold">👑 Administrador</Text>
                </View>
              )}
              {myPosition !== undefined && myPosition >= 0 && (
                <View className="mt-2 bg-secondary/20 rounded-full px-3 py-1">
                  <Text className="text-foreground text-xs font-bold">
                    🏆 {myPosition + 1}º lugar no ranking
                  </Text>
                </View>
              )}
            </View>

            {/* Estatísticas */}
            <View className="mx-4 mt-3 flex-row gap-2">
              <StatCard label="Pontos" value={totalPoints} emoji="⭐" />
              <StatCard label="Exatos" value={exactScores} emoji="🎯" />
              <StatCard label="Resultados" value={correctResults} emoji="✅" />
              <StatCard label="Apostas" value={totalBets} emoji="📋" />
            </View>

            {/* Histórico */}
            {myBets && myBets.length > 0 && (
              <Text className="px-4 mt-4 mb-2 text-sm font-bold text-foreground">
                📋 Histórico de Apostas
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-8 px-8">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-base font-semibold text-foreground text-center">
                Nenhuma aposta ainda
              </Text>
              <Text className="text-sm text-muted text-center mt-1">
                Acesse a aba Jogos e faça suas apostas!
              </Text>
            </View>
          ) : (
            <View className="items-center py-8">
              <ActivityIndicator color="#1A6B3C" />
            </View>
          )
        }
        ListFooterComponent={
          <View className="mx-4 mt-4 mb-6">
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}>
              <View className="bg-error/10 rounded-2xl py-4 items-center border border-error/20">
                <Text className="text-error font-bold">Sair da conta</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 8 }}
        renderItem={({ item }) => {
          const { bet, game } = item;
          const pointsColor =
            bet.points === 3 ? "text-success" : bet.points === 1 ? "text-warning" : "text-muted";
          const pointsBg =
            bet.points === 3 ? "bg-success/10" : bet.points === 1 ? "bg-warning/10" : "bg-muted/10";
          const pointsLabel =
            bet.points === 3 ? "🎯 +3" : bet.points === 1 ? "✅ +1" : "❌ 0";

          return (
            <View className="mx-4 mb-2 bg-surface rounded-xl p-3 border border-border flex-row items-center">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {game.homeFlag ?? ""} {game.homeTeam} × {game.awayTeam} {game.awayFlag ?? ""}
                </Text>
                <Text className="text-xs text-muted mt-0.5">
                  Aposta: {bet.homeScore} × {bet.awayScore}
                  {game.status === "finished"
                    ? ` · Resultado: ${game.homeScore} × ${game.awayScore}`
                    : ""}
                </Text>
                <Text className="text-xs text-muted">{formatDate(game.matchDate)}</Text>
              </View>
              {game.status === "finished" && (
                <View className={`px-2 py-1 rounded-lg ${pointsBg}`}>
                  <Text className={`text-xs font-bold ${pointsColor}`}>{pointsLabel}</Text>
                </View>
              )}
              {game.status === "upcoming" && (
                <View className="px-2 py-1 rounded-lg bg-primary/10">
                  <Text className="text-xs font-bold text-primary">Pendente</Text>
                </View>
              )}
              {game.status === "live" && (
                <View className="px-2 py-1 rounded-lg bg-error/10">
                  <Text className="text-xs font-bold text-error">Ao Vivo</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}
