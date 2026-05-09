import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

export default function LeaguesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [code, setCode] = useState("");

  const { data: myLeagues, isLoading, refetch } = trpc.leagues.myLeagues.useQuery();
  const joinMutation = trpc.leagues.join.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert("Código inválido", "Por favor, insira o código da liga.");
      return;
    }
    try {
      const league = await joinMutation.mutateAsync({ code: code.trim() });
      await refetch();
      setShowJoinModal(false);
      setCode("");
      Alert.alert("✅ Entrou na liga!", `Você entrou em "${league.name}" com sucesso!`);
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível entrar na liga.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View>
          <Text className="text-2xl font-bold text-foreground">👥 Ligas</Text>
          <Text className="text-sm text-muted">Suas ligas privadas</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowJoinModal(true)}
          activeOpacity={0.8}
        >
          <View className="bg-primary rounded-full px-4 py-2">
            <Text className="text-white font-bold text-sm">+ Entrar</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A6B3C" />
        </View>
      ) : !myLeagues || myLeagues.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">👥</Text>
          <Text className="text-lg font-semibold text-foreground text-center">
            Nenhuma liga ainda
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            Entre em uma liga privada usando o código de convite fornecido pelo administrador.
          </Text>
          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.8}
            style={{ marginTop: 16 }}
          >
            <View className="bg-primary rounded-2xl px-6 py-3">
              <Text className="text-white font-bold">Entrar com código</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myLeagues}
          keyExtractor={(item) => item.league.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6B3C" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/league/[id]", params: { id: item.league.id } })}
              activeOpacity={0.85}
            >
              <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{item.league.name}</Text>
                    {item.league.description && (
                      <Text className="text-sm text-muted mt-0.5" numberOfLines={2}>
                        {item.league.description}
                      </Text>
                    )}
                  </View>
                  <View className="bg-primary/10 rounded-xl px-3 py-1.5 ml-3">
                    <Text className="text-primary text-xs font-bold">{item.league.code}</Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-3 gap-1">
                  <Text className="text-xs text-muted">Ver ranking →</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal para entrar na liga */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-foreground mb-1">Entrar em uma Liga</Text>
            <Text className="text-sm text-muted mb-5">
              Insira o código de convite fornecido pelo administrador da liga.
            </Text>

            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="Ex: ABC123"
              placeholderTextColor="#9BA1A6"
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
              style={{
                borderWidth: 2,
                borderColor: "#1A6B3C",
                borderRadius: 12,
                padding: 14,
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: 4,
                color: "#0D1117",
                backgroundColor: "#F8F9FA",
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={handleJoin}
              activeOpacity={0.85}
              disabled={joinMutation.isPending}
            >
              <View className={`rounded-2xl py-4 items-center ${joinMutation.isPending ? "bg-muted/30" : "bg-primary"}`}>
                {joinMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">Entrar na Liga</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setShowJoinModal(false); setCode(""); }}
              activeOpacity={0.8}
              style={{ marginTop: 12 }}
            >
              <View className="py-3 items-center">
                <Text className="text-muted font-medium">Cancelar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
