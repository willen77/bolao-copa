import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { GameCard } from "@/components/GameCard";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Image } from "expo-image";

type FilterType = "all" | "upcoming" | "live" | "finished";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "upcoming", label: "Abertos" },
  { key: "live", label: "Ao Vivo" },
  { key: "finished", label: "Encerrados" },
];

export default function GamesScreen() {
  const router = useRouter();
  const { isAdmin } = useCurrentUser();
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: games, isLoading, refetch } = trpc.games.list.useQuery();
  const { data: myBets } = trpc.bets.myBets.useQuery();

  const betsMap = useMemo(() => {
    const map = new Map<number, { homeScore: number; awayScore: number; points: number }>();
    myBets?.forEach(({ bet }) => {
      map.set(bet.gameId, { homeScore: bet.homeScore, awayScore: bet.awayScore, points: bet.points });
    });
    return map;
  }, [myBets]);

  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (filter === "all") return games;
    return games.filter((g) => g.status === filter);
  }, [games, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 36, height: 36, borderRadius: 8 }}
            contentFit="cover"
          />
          <View>
            <Text className="text-xl font-bold text-foreground">Bolão da Copa</Text>
            <Text className="text-xs text-muted">Faça suas apostas!</Text>
          </View>
        </View>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/admin" as any)}
            activeOpacity={0.8}
          >
            <View className="bg-primary/10 rounded-full px-3 py-1.5">
              <Text className="text-primary text-xs font-bold">⚙ Admin</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View className="flex-row px-4 pb-3 gap-2">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <View
              className={
                filter === f.key
                  ? "bg-primary rounded-full px-3 py-1.5"
                  : "bg-surface border border-border rounded-full px-3 py-1.5"
              }
            >
              <Text
                className={
                  filter === f.key
                    ? "text-white text-xs font-bold"
                    : "text-muted text-xs font-medium"
                }
              >
                {f.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de jogos */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A6B3C" />
          <Text className="text-muted mt-3">Carregando jogos...</Text>
        </View>
      ) : filteredGames.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">⚽</Text>
          <Text className="text-lg font-semibold text-foreground text-center">
            Nenhum jogo encontrado
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            {filter === "all"
              ? "Os jogos serão adicionados em breve pelo administrador."
              : `Não há jogos com status "${FILTERS.find((f) => f.key === filter)?.label}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6B3C" />
          }
          renderItem={({ item }) => {
            const myBet = betsMap.get(item.id);
            return (
              <GameCard
                id={item.id}
                homeTeam={item.homeTeam}
                awayTeam={item.awayTeam}
                homeFlag={item.homeFlag}
                awayFlag={item.awayFlag}
                homeScore={item.homeScore}
                awayScore={item.awayScore}
                matchDate={item.matchDate}
                phase={item.phase}
                status={item.status}
                myBetHome={myBet?.homeScore}
                myBetAway={myBet?.awayScore}
                betPoints={myBet?.points}
                onPress={() => router.push({ pathname: "/game/[id]", params: { id: item.id } })}
              />
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
