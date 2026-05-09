import { useLocalAuth } from "@/hooks/use-local-auth";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";

export default function RegisterScreen() {
  const { register, isAuthenticated } = useLocalAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  if (isAuthenticated) {
    router.replace("/(tabs)");
    return null;
  }

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsRegistering(true);
    try {
      await register(email, name, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Erro ao registrar", err?.message || "Tente novamente");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 justify-center">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 100, height: 100, borderRadius: 24 }}
              contentFit="cover"
            />
            <Text className="text-3xl font-bold text-foreground mt-4">Criar Conta</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Junte-se ao Bolão da Copa!
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Name Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Nome</Text>
              <TextInput
                placeholder="Seu nome"
                placeholderTextColor="#9BA1A6"
                value={name}
                onChangeText={setName}
                editable={!isRegistering}
                autoCapitalize="words"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                editable={!isRegistering}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Senha</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                editable={!isRegistering}
                secureTextEntry
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Confirmar Senha</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9BA1A6"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isRegistering}
                secureTextEntry
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isRegistering}
            activeOpacity={0.85}
            style={{ width: "100%" }}
          >
            <View className="bg-primary rounded-2xl py-4 items-center shadow-lg">
              {isRegistering ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">Criar Conta</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row items-center justify-center mt-6 gap-1">
            <Text className="text-sm text-muted">Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm text-primary font-semibold">Fazer login</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted text-center mt-8">
            Ao criar uma conta, você concorda com os termos de uso do aplicativo.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
