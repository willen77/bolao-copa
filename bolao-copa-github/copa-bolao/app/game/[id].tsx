import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const gameId = parseInt(id ?? "0", 10);

  const { data: game, isLoading: gameLoading } = trpc.games.get.useQuery({ id: gameId });
  const { data: existingBet, refetch: refetchBet } = trpc.bets.getBetForGame.useQuery({ gameId });
  const placeBetMutation = trpc.bets.placeBet.useMutation();

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (existingBet) {
      setHomeScore(existingBet.homeScore.toString());
      setAwayScore(existingBet.awayScore.toString());
    }
  }, [existingBet]);

  const canBet = game?.status === "upcoming";

  const handleSubmit = async () => {
    if (!canBet) return;
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      Alert.alert("Aposta inválida", "Por favor, insira placares válidos (números inteiros ≥ 0).");
      return;
    }
    try {
      await placeBetMutation.mutateAsync({ gameId, homeScore: h, awayScore: a });
      await refetchBet();
      setSubmitted(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("✅ Aposta registrada!", `${game?.homeTeam} ${h} × ${a} ${game?.awayTeam}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível registrar a aposta.");
    }
  };

  if (gameLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1A6B3C" />
      </ScreenContainer>
    );
  }

  if (!game) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text className="text-foreground text-lg font-semibold">Jogo não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text className="text-primary mt-4">← Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const statusColors = {
    upcoming: { bg: "bg-success/10", text: "text-success", label: "Aberto para apostas" },
    live: { bg: "bg-error/10", text: "text-error", label: "🔴 Ao Vivo" },
    finished: { bg: "bg-muted/10", text: "text-muted", label: "Encerrado" },
  };
  const sc = statusColors[game.status];

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="flex-row items-center px-4 pt-4 pb-2">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <View className="w-10 h-10 items-center justify-center rounded-full bg-surface border border-border">
                <Text className="text-foreground text-lg">←</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground ml-3">Detalhes do Jogo</Text>
          </View>

          {/* Card do jogo */}
          <View className="mx-4 mt-2 bg-primary rounded-3xl p-6 shadow-lg">
            <Text className="text-white/70 text-xs text-center mb-4 font-medium uppercase tracking-wider">
              {game.phase}
            </Text>

            {/* Times */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 items-center gap-2">
                <Text className="text-5xl">{game.homeFlag ?? "🏳️"}</Text>
                <Text className="text-white font-bold text-base text-center" numberOfLines={2}>
                  {game.homeTeam}
                </Text>
              </View>

              <View className="items-center px-4">
                {game.status !== "upcoming" && game.homeScore !== null ? (
                  <View className="flex-row items-center gap-3">
                    <Text className="text-white text-4xl font-bold">{game.homeScore}</Text>
                    <Text className="text-white/60 text-2xl">×</Text>
                    <Text className="text-white text-4xl font-bold">{game.awayScore}</Text>
                  </View>
                ) : (
                  <Text className="text-white/60 text-2xl font-bold">VS</Text>
                )}
                <View className={`mt-2 px-3 py-1 rounded-full ${sc.bg}`}>
                  <Text className={`text-xs font-semibold ${sc.text}`}>{sc.label}</Text>
                </View>
              </View>

              <View className="flex-1 items-center gap-2">
                <Text className="text-5xl">{game.awayFlag ?? "🏳️"}</Text>
                <Text className="text-white font-bold text-base text-center" numberOfLines={2}>
                  {game.awayTeam}
                </Text>
              </View>
            </View>

            {/* Data */}
            <Text className="text-white/60 text-xs text-center mt-4">
              📅 {formatDate(game.matchDate)}
            </Text>
            {game.stadium && (
              <Text className="text-white/60 text-xs text-center mt-1">
                📍 {game.stadium}
              </Text>
            )}
          </View>

          {/* Formulário de aposta */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-base font-bold text-foreground mb-1">
              {existingBet ? "Sua Aposta" : "Fazer Aposta"}
            </Text>
            <Text className="text-xs text-muted mb-4">
              {canBet
                ? existingBet
                  ? "Você já apostou neste jogo. Pode alterar até o início."
                  : "Insira o placar que você prevê para este jogo."
                : "As apostas estão encerradas para este jogo."}
            </Text>

            <View className="flex-row items-center justify-center gap-4">
              {/* Placar casa */}
              <View className="items-center gap-1">
                <Text className="text-xs text-muted font-medium">{game.homeTeam}</Text>
                <TextInput
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={canBet}
                  placeholder="0"
                  placeholderTextColor="#9BA1A6"
                  returnKeyType="done"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: canBet ? "#1A6B3C" : "#D0D7DE",
                    backgroundColor: canBet ? "#F8F9FA" : "#F0F0F0",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#0D1117",
                  }}
                />
              </View>

              <Text className="text-3xl text-muted font-bold mt-4">×</Text>

              {/* Placar visitante */}
              <View className="items-center gap-1">
                <Text className="text-xs text-muted font-medium">{game.awayTeam}</Text>
                <TextInput
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={canBet}
                  placeholder="0"
                  placeholderTextColor="#9BA1A6"
                  returnKeyType="done"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: canBet ? "#1A6B3C" : "#D0D7DE",
                    backgroundColor: canBet ? "#F8F9FA" : "#F0F0F0",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#0D1117",
                  }}
                />
              </View>
            </View>

            {/* Pontuação explicada */}
            <View className="mt-4 bg-background rounded-xl p-3 gap-1">
              <Text className="text-xs text-muted font-semibold mb-1">Sistema de pontos:</Text>
              <Text className="text-xs text-muted">🎯 Placar exato → 3 pontos</Text>
              <Text className="text-xs text-muted">✅ Resultado correto → 1 ponto</Text>
              <Text className="text-xs text-muted">❌ Errou → 0 pontos</Text>
            </View>

            {/* Resultado da aposta (se encerrado) */}
            {existingBet && game.status === "finished" && (
              <View
                className={`mt-4 rounded-xl p-3 items-center ${
                  existingBet.points === 3
                    ? "bg-success/10"
                    : existingBet.points === 1
                    ? "bg-warning/10"
                    : "bg-error/10"
                }`}
              >
                <Text
                  className={`text-lg font-bold ${
                    existingBet.points === 3
                      ? "text-success"
                      : existingBet.points === 1
                      ? "text-warning"
                      : "text-error"
                  }`}
                >
                  {existingBet.points === 3
                    ? "🎯 Placar exato! +3 pontos"
                    : existingBet.points === 1
                    ? "✅ Resultado correto! +1 ponto"
                    : "❌ Não pontuou desta vez"}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Sua aposta: {existingBet.homeScore} × {existingBet.awayScore}
                </Text>
              </View>
            )}

            {/* Botão de confirmar */}
            {canBet && (
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={placeBetMutation.isPending}
                style={{ marginTop: 16 }}
              >
                <View
                  className={`rounded-2xl py-4 items-center ${
                    placeBetMutation.isPending ? "bg-muted/30" : "bg-primary"
                  }`}
                >
                  {placeBetMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {existingBet ? "Atualizar Aposta" : "Confirmar Aposta"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
