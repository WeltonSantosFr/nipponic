"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { saveAuthCookie, removeAuthCookie } from "../actions/auth";
import { jwtDecode } from "jwt-decode";
import type { UserPayload } from "@nipponic/shared";

export type { UserPayload };

interface AuthContextData {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isWakingServer: boolean;
  setIsWakingServer: (waking: boolean) => void;
  hasInitialToken: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserPayload | null) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode; 
  initialUser: UserPayload | null 
}) {
  const [user, setUser] = useState<UserPayload | null>(initialUser);
  const [isWakingServer, setIsWakingServer] = useState<boolean>(!!initialUser);
  const hasInitialToken = !!initialUser;

  const login = async (token: string) => {
    await saveAuthCookie(token);
    setUser(jwtDecode<UserPayload>(token));
    setIsWakingServer(false);
  };

  const logout = async () => {
    await removeAuthCookie();
    setUser(null);
    setIsWakingServer(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isWakingServer,
        setIsWakingServer,
        hasInitialToken,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);