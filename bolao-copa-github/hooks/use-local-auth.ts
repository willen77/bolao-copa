import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

export interface LocalUser {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
  isBlocked: boolean;
}

export interface LocalAuthState {
  user: LocalUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = "bolao_auth_token";

export function useLocalAuth() {
  const [state, setState] = useState<LocalAuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Chamar hooks no nível superior
  const utils = trpc.useUtils();

  // Restaurar token ao iniciar
  useEffect(() => {
    async function restoreToken() {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          // Verificar se o token é válido
          try {
            const user = await utils.client.auth.verifyToken.query({ token });
            setState({
              user,
              token,
              loading: false,
              error: null,
              isAuthenticated: true,
            });
          } catch (err) {
            // Token inválido
            await AsyncStorage.removeItem(TOKEN_KEY);
            setState({
              user: null,
              token: null,
              loading: false,
              error: null,
              isAuthenticated: false,
            });
          }
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error("[Auth] Failed to restore token:", err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    restoreToken();
  }, [utils]);

  const register = async (email: string, name: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await utils.client.auth.register.mutate({
        email,
        name,
        password,
      });

      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setState({
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      });

      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao registrar";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await utils.client.auth.login.mutate({
        email,
        password,
      });

      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setState({
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      });

      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao fazer login";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setState({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  };

  return {
    ...state,
    register,
    login,
    logout,
  };
}
