import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

function Avatar({ name, avatarUrl, size = 36 }: { name: string | null; avatarUrl?: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#1A6B3C", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "white", fontWeight: "bold", fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
}

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const leagueId = parseInt(id ?? "0", 10);
  const { user } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const { data: league } = trpc.leagues.getById.useQuery({ id: leagueId });
  const { data: ranking, isLoading, refetch } = trpc.ranking.league.useQuery({ leagueId });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <View className="w-10 h-10 items-center justify-center rounded-full bg-surface border border-border">
            <Text className="text-foreground text-lg">←</Text>
          </View>
        </TouchableOpacity>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {league?.name ?? "Liga"}
          </Text>
          {league?.code && (
            <Text className="text-xs text-muted">Código: {league.code}</Text>
          )}
        </View>
      </View>

      {/* Descrição */}
      {league?.description && (
        <View className="mx-4 mb-3 bg-surface rounded-xl p-3 border border-border">
          <Text className="text-sm text-muted">{league.description}</Text>
        </View>
      )}

      {/* Ranking da liga */}
      <Text className="px-4 text-sm font-bold text-foreground mb-2">🏆 Ranking da Liga</Text>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A6B3C" />
        </View>
      ) : !ranking || ranking.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">👥</Text>
          <Text className="text-base font-semibold text-foreground text-center">Ranking vazio</Text>
          <Text className="text-sm text-muted text-center mt-1">Nenhuma aposta registrada ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(item) => item.user.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6B3C" />}
          renderItem={({ item }) => {
            const isMe = item.user.id === user?.id;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <View className={`mb-2 flex-row items-center p-3 rounded-xl border ${isMe ? "bg-primary/5 border-primary/30" : "bg-surface border-border"}`}>
                <Text className="text-base font-bold text-muted w-8 text-center">
                  {item.position <= 3 ? medals[item.position - 1] : `${item.position}º`}
                </Text>
                <Avatar name={item.user.name} avatarUrl={item.user.avatarUrl} size={36} />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-foreground">
                    {item.user.name ?? "Anônimo"}{isMe ? " (você)" : ""}
                  </Text>
                  <Text className="text-xs text-muted">
                    🎯 {item.exactScores} · ✅ {item.correctResults} · {item.totalBets} apostas
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-primary">{item.totalPoints}</Text>
                  <Text className="text-xs text-muted">pts</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
