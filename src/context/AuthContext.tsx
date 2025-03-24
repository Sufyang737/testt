"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getProfileById, updateProfile } from "@/service/profile";
import { goToAuth } from "@/util/utils";
import { userType } from "@/util/type";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userId: string, token: string) => void;
  logout: () => void;
  userId: string;
  token: string;
  updateToken: (token: string, refreshToken: string) => void;
  refreshToken: string;
  name: string;
  updateProfile: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [firstTimeAux, setFirstTimeAux] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const getProfile = useCallback(async (userId: string, token: string) => {
    // Si el usuario usuario tiene el token vencido lo envía a autenticarse
    const response = (await getProfileById(userId, token, () =>
      goToAuth(router),
    )) as userType;
    // actualiza los datos del usuario que se van a usar la aplicación
    setName(response.name);
  }, [router]);

  useEffect(() => {
    // Recupera los datos guardados en el localStorage
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    // Verifica si el usuario está dentro de las rutas de autenticación
    if (
      pathname !== "/authentication" &&
      pathname !== "/login" &&
      !pathname.includes("/register") &&
      pathname !== "/restore-password" &&
      !pathname.includes("/new-password")
    ) {
      // Verifica si los datos de autenticación están presentes
      if (userId && token && refreshToken && userId && !firstTimeAux) {
        setUserId(userId);
        setToken(token);
        setRefreshToken(refreshToken);
        setFirstTimeAux(true);
        getProfile(userId, token);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [pathname, firstTimeAux, getProfile]);

  const updateProfile = async () => {
    await getProfile(userId, token);
  };

  const login = (userId: string, token: string) => {
    setIsAuthenticated(true);
    setUserId(userId);
    getProfile(userId, token);
    localStorage.setItem("userId", userId);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId("");
    setToken("");
    setRefreshToken("");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  const updateToken = (token: string, refreshToken: string) => {
    setToken(token);
    setRefreshToken(refreshToken);
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  };

  const authContextValue: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    userId,
    token,
    updateToken,
    refreshToken,
    name,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};