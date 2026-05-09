import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Image } from "expo-image";

const MEDAL_COLORS = ["#F5C518", "#C0C0C0", "#CD7F32"];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

function Avatar({ name, avatarUrl, size = 40 }: { name: string | null; avatarUrl?: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#1A6B3C",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold", fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
}

function PodiumCard({
  position,
  name,
  avatarUrl,
  points,
  isCurrentUser,
}: {
  position: number;
  name: string | null;
  avatarUrl?: string | null;
  points: number;
  isCurrentUser: boolean;
}) {
  const heights = [100, 80, 65];
  const height = heights[position - 1] ?? 60;

  return (
    <View className="items-center flex-1">
      <View className={`items-center mb-1 ${isCurrentUser ? "opacity-100" : "opacity-90"}`}>
        <Avatar name={name} avatarUrl={avatarUrl} size={position === 1 ? 56 : 44} />
        {isCurrentUser && (
          <View className="absolute -top-1 -right-1 bg-primary rounded-full w-4 h-4 items-center justify-center">
            <Text style={{ fontSize: 8, color: "white" }}>★</Text>
          </View>
        )}
      </View>
      <Text className="text-xs font-semibold text-foreground text-center" numberOfLines={1} style={{ maxWidth: 80 }}>
        {name ?? "Anônimo"}
      </Text>
      <Text className="text-xs text-muted">{points} pts</Text>
      <View
        style={{
          height,
          width: "100%",
          backgroundColor: MEDAL_COLORS[position - 1],
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 8,
          marginTop: 6,
        }}
      >
        <Text style={{ fontSize: position === 1 ? 28 : 22 }}>{MEDAL_EMOJIS[position - 1]}</Text>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>{position}º</Text>
      </View>
    </View>
  );
}

export default function RankingScreen() {
  const { user } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);
  const { data: ranking, isLoading, refetch } = trpc.ranking.global.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const top3 = ranking?.slice(0, 3) ?? [];
  const rest = ranking?.slice(3) ?? [];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">🏆 Ranking</Text>
        <Text className="text-sm text-muted">Classificação geral do bolão</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A6B3C" />
        </View>
      ) : !ranking || ranking.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">🏆</Text>
          <Text className="text-lg font-semibold text-foreground text-center">
            Ranking vazio
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            O ranking será atualizado após os primeiros resultados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.user.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6B3C" />
          }
          ListHeaderComponent={
            <>
              {/* Pódio top 3 */}
              {top3.length > 0 && (
                <View className="mx-4 mt-2 mb-4 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-xs text-muted font-semibold text-center mb-4 uppercase tracking-wider">
                    Top 3
                  </Text>
                  <View className="flex-row items-end justify-center gap-2">
                    {/* 2º lugar */}
                    {top3[1] && (
                      <PodiumCard
                        position={2}
                        name={top3[1].user.name}
                        avatarUrl={top3[1].user.avatarUrl}
                        points={top3[1].totalPoints}
                        isCurrentUser={top3[1].user.id === user?.id}
                      />
                    )}
                    {/* 1º lugar */}
                    {top3[0] && (
                      <PodiumCard
                        position={1}
                        name={top3[0].user.name}
                        avatarUrl={top3[0].user.avatarUrl}
                        points={top3[0].totalPoints}
                        isCurrentUser={top3[0].user.id === user?.id}
                      />
                    )}
                    {/* 3º lugar */}
                    {top3[2] && (
                      <PodiumCard
                        position={3}
                        name={top3[2].user.name}
                        avatarUrl={top3[2].user.avatarUrl}
                        points={top3[2].totalPoints}
                        isCurrentUser={top3[2].user.id === user?.id}
                      />
                    )}
                  </View>
                </View>
              )}

              {rest.length > 0 && (
                <Text className="px-4 text-xs text-muted font-semibold uppercase tracking-wider mb-2">
                  Classificação Completa
                </Text>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isMe = item.user.id === user?.id;
            return (
              <View
                className={`mx-4 mb-2 flex-row items-center p-3 rounded-xl border ${
                  isMe ? "bg-primary/5 border-primary/30" : "bg-surface border-border"
                }`}
              >
                <Text className="text-base font-bold text-muted w-8 text-center">
                  {item.position}º
                </Text>
                <Avatar name={item.user.name} avatarUrl={item.user.avatarUrl} size={36} />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-foreground">
                    {item.user.name ?? "Anônimo"}{isMe ? " (você)" : ""}
                  </Text>
                  <Text className="text-xs text-muted">
                    🎯 {item.exactScores} exatos · ✅ {item.correctResults} resultados
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
