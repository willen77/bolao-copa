import { Text, TouchableOpacity, View } from "react-native";

type GameStatus = "upcoming" | "live" | "finished";

interface GameCardProps {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  matchDate: string | Date;
  phase?: string | null;
  status: GameStatus;
  myBetHome?: number;
  myBetAway?: number;
  betPoints?: number;
  onPress?: () => void;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GameCard({
  homeTeam,
  awayTeam,
  homeFlag,
  awayFlag,
  homeScore,
  awayScore,
  matchDate,
  phase,
  status,
  myBetHome,
  myBetAway,
  betPoints,
  onPress,
}: GameCardProps) {
  const hasBet = myBetHome !== undefined && myBetAway !== undefined;

  const statusConfig = {
    upcoming: { bg: "bg-success/10", text: "text-success", label: "Aberto", dot: "🟢" },
    live: { bg: "bg-error/10", text: "text-error", label: "Ao Vivo", dot: "🔴" },
    finished: { bg: "bg-muted/10", text: "text-muted", label: "Encerrado", dot: "⚫" },
  };
  const sc = statusConfig[status];

  const pointsConfig =
    betPoints === 3
      ? { bg: "bg-success/10", text: "text-success", label: "🎯 +3 pts" }
      : betPoints === 1
      ? { bg: "bg-warning/10", text: "text-warning", label: "✅ +1 pt" }
      : betPoints === 0 && status === "finished"
      ? { bg: "bg-error/10", text: "text-error", label: "❌ 0 pts" }
      : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View className="bg-surface rounded-2xl mb-3 overflow-hidden border border-border">
        {/* Header da fase */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <Text className="text-xs text-muted font-medium">{phase ?? "Copa do Mundo"}</Text>
          <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${sc.bg}`}>
            <Text className="text-xs">{sc.dot}</Text>
            <Text className={`text-xs font-semibold ${sc.text}`}>{sc.label}</Text>
          </View>
        </View>

        {/* Times e placar */}
        <View className="flex-row items-center justify-between px-4 pb-3">
          {/* Time da casa */}
          <View className="flex-1 items-center gap-1">
            <Text className="text-3xl">{homeFlag ?? "🏳️"}</Text>
            <Text className="text-sm font-bold text-foreground text-center" numberOfLines={2}>
              {homeTeam}
            </Text>
          </View>

          {/* Placar central */}
          <View className="items-center px-4">
            {status !== "upcoming" && homeScore !== null && homeScore !== undefined ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-3xl font-bold text-foreground">{homeScore}</Text>
                <Text className="text-xl text-muted">–</Text>
                <Text className="text-3xl font-bold text-foreground">{awayScore}</Text>
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-2xl font-bold text-muted">VS</Text>
                <Text className="text-xs text-muted mt-0.5">{formatDate(matchDate)}</Text>
              </View>
            )}
            {status === "finished" && (
              <Text className="text-xs text-muted mt-1">{formatDate(matchDate)}</Text>
            )}
          </View>

          {/* Time visitante */}
          <View className="flex-1 items-center gap-1">
            <Text className="text-3xl">{awayFlag ?? "🏳️"}</Text>
            <Text className="text-sm font-bold text-foreground text-center" numberOfLines={2}>
              {awayTeam}
            </Text>
          </View>
        </View>

        {/* Aposta do usuário */}
        {hasBet ? (
          <View className="border-t border-border px-4 py-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-muted">Sua aposta:</Text>
              <Text className="text-xs font-bold text-foreground">
                {myBetHome} – {myBetAway}
              </Text>
            </View>
            {pointsConfig ? (
              <View className={`px-2 py-0.5 rounded-full ${pointsConfig.bg}`}>
                <Text className={`text-xs font-bold ${pointsConfig.text}`}>{pointsConfig.label}</Text>
              </View>
            ) : (
              <Text className="text-xs text-muted">Aguardando resultado</Text>
            )}
          </View>
        ) : status === "upcoming" ? (
          <View className="border-t border-border px-4 py-2">
            <Text className="text-xs text-primary font-medium text-center">
              Toque para fazer sua aposta →
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
