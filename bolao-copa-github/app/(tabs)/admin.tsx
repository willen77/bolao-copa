import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "expo-router";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AdminSection = "games" | "results" | "users" | "leagues";

// ─── Componente de seção ──────────────────────────────────────────────────────

function SectionButton({
  label,
  emoji,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
      <View
        className={`rounded-xl p-3 items-center border ${
          active ? "bg-primary border-primary" : "bg-surface border-border"
        }`}
      >
        <Text className="text-xl">{emoji}</Text>
        <Text className={`text-xs font-semibold mt-1 ${active ? "text-white" : "text-muted"}`}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Gerenciar Jogos ──────────────────────────────────────────────────────────

function GamesSection() {
  const [showModal, setShowModal] = useState(false);
  const [editGame, setEditGame] = useState<any>(null);
  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    homeFlag: "",
    awayFlag: "",
    matchDate: "",
    phase: "Fase de Grupos",
    stadium: "",
  });

  const { data: games, isLoading, refetch } = trpc.games.list.useQuery();
  const createMutation = trpc.games.create.useMutation();
  const updateMutation = trpc.games.update.useMutation();
  const deleteMutation = trpc.games.delete.useMutation();
  const setStatusMutation = trpc.games.setStatus.useMutation();

  const resetForm = () => {
    setForm({ homeTeam: "", awayTeam: "", homeFlag: "", awayFlag: "", matchDate: "", phase: "Fase de Grupos", stadium: "" });
    setEditGame(null);
  };

  const openEdit = (game: any) => {
    setEditGame(game);
    const d = new Date(game.matchDate);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setForm({
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeFlag: game.homeFlag ?? "",
      awayFlag: game.awayFlag ?? "",
      matchDate: dateStr,
      phase: game.phase ?? "Fase de Grupos",
      stadium: game.stadium ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.homeTeam || !form.awayTeam || !form.matchDate) {
      Alert.alert("Campos obrigatórios", "Preencha os times e a data do jogo.");
      return;
    }
    try {
      const matchDate = new Date(form.matchDate).toISOString();
      if (editGame) {
        await updateMutation.mutateAsync({ id: editGame.id, ...form, matchDate });
        Alert.alert("✅ Jogo atualizado!");
      } else {
        await createMutation.mutateAsync({ ...form, matchDate });
        Alert.alert("✅ Jogo criado!");
      }
      await refetch();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível salvar o jogo.");
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert("Excluir jogo", `Deseja excluir "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id });
          await refetch();
        },
      },
    ]);
  };

  const handleSetStatus = (id: number, status: "upcoming" | "live" | "finished") => {
    Alert.alert("Alterar status", `Marcar como "${status}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          await setStatusMutation.mutateAsync({ id, status });
          await refetch();
        },
      },
    ]);
  };

  const statusLabel = { upcoming: "Aberto", live: "Ao Vivo", finished: "Encerrado" };
  const statusColor = { upcoming: "text-success", live: "text-error", finished: "text-muted" };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-bold text-foreground">⚽ Jogos ({games?.length ?? 0})</Text>
        <TouchableOpacity onPress={() => { resetForm(); setShowModal(true); }} activeOpacity={0.8}>
          <View className="bg-primary rounded-full px-3 py-1.5">
            <Text className="text-white text-xs font-bold">+ Novo Jogo</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A6B3C" />
        </View>
      ) : (
        <FlatList
          data={games ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-xl mb-2 p-3 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">
                    {item.homeFlag} {item.homeTeam} × {item.awayTeam} {item.awayFlag}
                  </Text>
                  <Text className="text-xs text-muted mt-0.5">{item.phase}</Text>
                  <Text className={`text-xs font-semibold mt-0.5 ${statusColor[item.status]}`}>
                    {statusLabel[item.status]}
                    {item.status === "finished" && item.homeScore !== null
                      ? ` · ${item.homeScore}×${item.awayScore}`
                      : ""}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.8}>
                    <View className="bg-primary/10 rounded-lg px-2 py-1">
                      <Text className="text-primary text-xs font-bold">Editar</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, `${item.homeTeam} × ${item.awayTeam}`)} activeOpacity={0.8}>
                    <View className="bg-error/10 rounded-lg px-2 py-1">
                      <Text className="text-error text-xs font-bold">Excluir</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Status buttons */}
              <View className="flex-row gap-2 mt-2">
                {(["upcoming", "live", "finished"] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSetStatus(item.id, s)}
                    activeOpacity={0.8}
                    disabled={item.status === s}
                  >
                    <View className={`rounded-lg px-2 py-1 ${item.status === s ? "bg-primary" : "bg-surface border border-border"}`}>
                      <Text className={`text-xs font-medium ${item.status === s ? "text-white" : "text-muted"}`}>
                        {statusLabel[s]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted text-sm">Nenhum jogo cadastrado.</Text>
            </View>
          }
        />
      )}

      {/* Modal criar/editar jogo */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => { setShowModal(false); resetForm(); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView style={{ maxHeight: "90%" }}>
            <View className="bg-background rounded-t-3xl p-6">
              <Text className="text-xl font-bold text-foreground mb-4">
                {editGame ? "Editar Jogo" : "Novo Jogo"}
              </Text>

              {[
                { key: "homeTeam", label: "Time da Casa *", placeholder: "Ex: Brasil" },
                { key: "awayTeam", label: "Time Visitante *", placeholder: "Ex: Argentina" },
                { key: "homeFlag", label: "Bandeira Casa (emoji)", placeholder: "🇧🇷" },
                { key: "awayFlag", label: "Bandeira Visitante (emoji)", placeholder: "🇦🇷" },
                { key: "matchDate", label: "Data e Hora * (AAAA-MM-DDTHH:MM)", placeholder: "2026-06-14T16:00" },
                { key: "phase", label: "Fase", placeholder: "Fase de Grupos" },
                { key: "stadium", label: "Estádio", placeholder: "Estádio Nacional" },
              ].map(({ key, label, placeholder }) => (
                <View key={key} className="mb-3">
                  <Text className="text-xs text-muted font-medium mb-1">{label}</Text>
                  <TextInput
                    value={(form as any)[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    placeholder={placeholder}
                    placeholderTextColor="#9BA1A6"
                    returnKeyType="done"
                    style={{
                      borderWidth: 1,
                      borderColor: "#D0D7DE",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      color: "#0D1117",
                      backgroundColor: "#F8F9FA",
                    }}
                  />
                </View>
              ))}

              <TouchableOpacity onPress={handleSave} activeOpacity={0.85} disabled={createMutation.isPending || updateMutation.isPending}>
                <View className={`rounded-2xl py-4 items-center mt-2 ${(createMutation.isPending || updateMutation.isPending) ? "bg-muted/30" : "bg-primary"}`}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">{editGame ? "Salvar Alterações" : "Criar Jogo"}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }} activeOpacity={0.8} style={{ marginTop: 12 }}>
                <View className="py-3 items-center">
                  <Text className="text-muted font-medium">Cancelar</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Inserir Resultados ───────────────────────────────────────────────────────

function ResultsSection() {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const { data: games, refetch } = trpc.games.list.useQuery();
  const setResultMutation = trpc.games.setResult.useMutation();

  const openGames = games?.filter((g) => g.status !== "finished") ?? [];

  const handleSetResult = async () => {
    if (!selectedGame) return;
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      Alert.alert("Placar inválido", "Insira valores válidos.");
      return;
    }
    Alert.alert(
      "Confirmar resultado",
      `${selectedGame.homeTeam} ${h} × ${a} ${selectedGame.awayTeam}\n\nIsso calculará os pontos de todos os participantes.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await setResultMutation.mutateAsync({ id: selectedGame.id, homeScore: h, awayScore: a });
              await refetch();
              setSelectedGame(null);
              setHomeScore("");
              setAwayScore("");
              Alert.alert("✅ Resultado registrado!", "Os pontos foram calculados automaticamente.");
            } catch (err: any) {
              Alert.alert("Erro", err?.message ?? "Não foi possível registrar o resultado.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text className="text-base font-bold text-foreground mb-3">🏁 Inserir Resultado</Text>

      {openGames.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-muted text-sm">Nenhum jogo pendente de resultado.</Text>
        </View>
      ) : (
        <>
          <Text className="text-xs text-muted mb-2">Selecione o jogo:</Text>
          {openGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              onPress={() => {
                setSelectedGame(game);
                setHomeScore("");
                setAwayScore("");
              }}
              activeOpacity={0.8}
            >
              <View
                className={`rounded-xl mb-2 p-3 border ${
                  selectedGame?.id === game.id ? "bg-primary/10 border-primary" : "bg-surface border-border"
                }`}
              >
                <Text className="text-sm font-semibold text-foreground">
                  {game.homeFlag} {game.homeTeam} × {game.awayTeam} {game.awayFlag}
                </Text>
                <Text className="text-xs text-muted mt-0.5">{game.phase}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {selectedGame && (
            <View className="mt-4 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm font-bold text-foreground mb-3 text-center">
                {selectedGame.homeTeam} × {selectedGame.awayTeam}
              </Text>
              <View className="flex-row items-center justify-center gap-4">
                <View className="items-center">
                  <Text className="text-xs text-muted mb-1">{selectedGame.homeTeam}</Text>
                  <TextInput
                    value={homeScore}
                    onChangeText={setHomeScore}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
                    returnKeyType="done"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#1A6B3C",
                      backgroundColor: "#F8F9FA",
                      fontSize: 28,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "#0D1117",
                    }}
                  />
                </View>
                <Text className="text-2xl text-muted font-bold mt-4">×</Text>
                <View className="items-center">
                  <Text className="text-xs text-muted mb-1">{selectedGame.awayTeam}</Text>
                  <TextInput
                    value={awayScore}
                    onChangeText={setAwayScore}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor="#9BA1A6"
                    returnKeyType="done"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#1A6B3C",
                      backgroundColor: "#F8F9FA",
                      fontSize: 28,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "#0D1117",
                    }}
                  />
                </View>
              </View>
              <TouchableOpacity onPress={handleSetResult} activeOpacity={0.85} disabled={setResultMutation.isPending} style={{ marginTop: 16 }}>
                <View className={`rounded-2xl py-4 items-center ${setResultMutation.isPending ? "bg-muted/30" : "bg-primary"}`}>
                  {setResultMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold">Confirmar Resultado</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ─── Gerenciar Usuários ───────────────────────────────────────────────────────

function UsersSection() {
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  const blockMutation = trpc.users.block.useMutation();
  const setRoleMutation = trpc.users.setRole.useMutation();

  const handleBlock = (userId: number, name: string | null, isBlocked: boolean) => {
    Alert.alert(
      isBlocked ? "Desbloquear usuário" : "Bloquear usuário",
      `${isBlocked ? "Desbloquear" : "Bloquear"} "${name ?? "Usuário"}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: isBlocked ? "default" : "destructive",
          onPress: async () => {
            await blockMutation.mutateAsync({ userId, isBlocked: !isBlocked });
            await refetch();
          },
        },
      ]
    );
  };

  const handleSetAdmin = (userId: number, name: string | null, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    Alert.alert(
      "Alterar perfil",
      `Tornar "${name ?? "Usuário"}" ${newRole === "admin" ? "administrador" : "usuário comum"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await setRoleMutation.mutateAsync({ userId, role: newRole });
            await refetch();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <Text className="px-4 py-3 text-base font-bold text-foreground">
        👥 Usuários ({users?.length ?? 0})
      </Text>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A6B3C" />
        </View>
      ) : (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className={`bg-surface rounded-xl mb-2 p-3 border ${item.isBlocked ? "border-error/30 bg-error/5" : "border-border"}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-foreground">{item.name ?? "Sem nome"}</Text>
                    {item.role === "admin" && (
                      <View className="bg-primary/10 rounded-full px-2 py-0.5">
                        <Text className="text-primary text-xs font-bold">Admin</Text>
                      </View>
                    )}
                    {item.isBlocked && (
                      <View className="bg-error/10 rounded-full px-2 py-0.5">
                        <Text className="text-error text-xs font-bold">Bloqueado</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-muted mt-0.5">{item.email ?? "Sem e-mail"}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => handleSetAdmin(item.id, item.name, item.role)} activeOpacity={0.8}>
                    <View className="bg-primary/10 rounded-lg px-2 py-1">
                      <Text className="text-primary text-xs font-bold">
                        {item.role === "admin" ? "→ User" : "→ Admin"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleBlock(item.id, item.name, item.isBlocked)} activeOpacity={0.8}>
                    <View className={`rounded-lg px-2 py-1 ${item.isBlocked ? "bg-success/10" : "bg-error/10"}`}>
                      <Text className={`text-xs font-bold ${item.isBlocked ? "text-success" : "text-error"}`}>
                        {item.isBlocked ? "Desbloquear" : "Bloquear"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted text-sm">Nenhum usuário encontrado.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Gerenciar Ligas ──────────────────────────────────────────────────────────

function LeaguesSection() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: leagues, isLoading, refetch } = trpc.leagues.all.useQuery();
  const createMutation = trpc.leagues.create.useMutation();
  const deleteMutation = trpc.leagues.delete.useMutation();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Insira um nome para a liga.");
      return;
    }
    try {
      await createMutation.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      await refetch();
      setShowModal(false);
      setName("");
      setDescription("");
      Alert.alert("✅ Liga criada!", "O código de convite foi gerado automaticamente.");
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível criar a liga.");
    }
  };

  const handleDelete = (id: number, leagueName: string) => {
    Alert.alert("Excluir liga", `Excluir "${leagueName}"? Todos os membros serão removidos.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id });
          await refetch();
        },
      },
    ]);
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-bold text-foreground">🏅 Ligas ({leagues?.length ?? 0})</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <View className="bg-primary rounded-full px-3 py-1.5">
            <Text className="text-white text-xs font-bold">+ Nova Liga</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1A6B3C" />
        </View>
      ) : (
        <FlatList
          data={leagues ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-xl mb-2 p-3 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{item.name}</Text>
                  {item.description && (
                    <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>{item.description}</Text>
                  )}
                  <View className="flex-row items-center mt-1 gap-1">
                    <Text className="text-xs text-muted">Código:</Text>
                    <View className="bg-primary/10 rounded-full px-2 py-0.5">
                      <Text className="text-primary text-xs font-bold tracking-widest">{item.code}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} activeOpacity={0.8}>
                  <View className="bg-error/10 rounded-lg px-2 py-1 ml-2">
                    <Text className="text-error text-xs font-bold">Excluir</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted text-sm">Nenhuma liga criada.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-foreground mb-4">Nova Liga Privada</Text>

            <Text className="text-xs text-muted font-medium mb-1">Nome da Liga *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Turma da Firma"
              placeholderTextColor="#9BA1A6"
              returnKeyType="done"
              style={{ borderWidth: 1, borderColor: "#D0D7DE", borderRadius: 10, padding: 12, fontSize: 14, color: "#0D1117", backgroundColor: "#F8F9FA", marginBottom: 12 }}
            />

            <Text className="text-xs text-muted font-medium mb-1">Descrição (opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição da liga..."
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={3}
              returnKeyType="done"
              style={{ borderWidth: 1, borderColor: "#D0D7DE", borderRadius: 10, padding: 12, fontSize: 14, color: "#0D1117", backgroundColor: "#F8F9FA", marginBottom: 16, minHeight: 80, textAlignVertical: "top" }}
            />

            <Text className="text-xs text-muted text-center mb-4">
              Um código de convite único será gerado automaticamente.
            </Text>

            <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} disabled={createMutation.isPending}>
              <View className={`rounded-2xl py-4 items-center ${createMutation.isPending ? "bg-muted/30" : "bg-primary"}`}>
                {createMutation.isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Criar Liga</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.8} style={{ marginTop: 12 }}>
              <View className="py-3 items-center">
                <Text className="text-muted font-medium">Cancelar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Tela Principal Admin ─────────────────────────────────────────────────────

export default function AdminScreen() {
  const { isAdmin, isLoading } = useCurrentUser();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("games");

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1A6B3C" />
      </ScreenContainer>
    );
  }

  if (!isAdmin) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text className="text-5xl mb-4">🔒</Text>
        <Text className="text-lg font-semibold text-foreground text-center">Acesso Restrito</Text>
        <Text className="text-sm text-muted text-center mt-2">
          Esta área é exclusiva para administradores.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-2xl font-bold text-foreground">⚙️ Painel Admin</Text>
        <Text className="text-sm text-muted">Gerencie o bolão da Copa</Text>
      </View>

      {/* Seções */}
      <View className="flex-row px-4 gap-2 mb-3">
        <SectionButton label="Jogos" emoji="⚽" active={section === "games"} onPress={() => setSection("games")} />
        <SectionButton label="Resultados" emoji="🏁" active={section === "results"} onPress={() => setSection("results")} />
        <SectionButton label="Usuários" emoji="👥" active={section === "users"} onPress={() => setSection("users")} />
        <SectionButton label="Ligas" emoji="🏅" active={section === "leagues"} onPress={() => setSection("leagues")} />
      </View>

      {/* Conteúdo */}
      <View className="flex-1">
        {section === "games" && <GamesSection />}
        {section === "results" && <ResultsSection />}
        {section === "users" && <UsersSection />}
        {section === "leagues" && <LeaguesSection />}
      </View>
    </ScreenContainer>
  );
}
