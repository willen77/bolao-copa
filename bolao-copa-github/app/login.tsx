import { useLocalAuth } from "@/hooks/use-local-auth";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
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

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated, login } = useLocalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1A6B3C" />
      </ScreenContainer>
    );
  }

  if (isAuthenticated || user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Erro ao fazer login", err?.message || "Tente novamente");
    } finally {
      setIsLoggingIn(false);
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
            <Text className="text-3xl font-bold text-foreground mt-4">Bolão da Copa</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Faça suas apostas e dispute com amigos!
            </Text>
          </View>

          {/* Decoração */}
          <View className="w-full items-center mb-8">
            <View className="flex-row gap-3 mb-2">
              <Text className="text-3xl">⚽</Text>
              <Text className="text-3xl">🏆</Text>
              <Text className="text-3xl">🥇</Text>
            </View>
            <Text className="text-xs text-muted text-center">
              Acerte o placar exato e ganhe 3 pontos{"\n"}
              Acerte o resultado e ganhe 1 ponto
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                editable={!isLoggingIn}
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
                editable={!isLoggingIn}
                secureTextEntry
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoggingIn}
            activeOpacity={0.85}
            style={{ width: "100%" }}
          >
            <View className="bg-primary rounded-2xl py-4 items-center shadow-lg">
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">Entrar</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Cadastro Link */}
          <View className="flex-row items-center justify-center mt-6 gap-1">
            <Text className="text-sm text-muted">Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-sm text-primary font-semibold">Criar conta</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted text-center mt-8">
            Ao entrar, você concorda com os termos de uso do aplicativo.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
