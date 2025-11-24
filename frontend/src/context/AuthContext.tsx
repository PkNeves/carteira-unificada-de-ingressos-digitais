import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  walletAddress?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      // Adia fetchUser para não bloquear FCP - usa requestIdleCallback ou setTimeout
      // No mobile, isso é crítico para melhorar FCP
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            fetchUser(storedToken);
          },
          { timeout: 100 }
        );
      } else {
        // Fallback: adia com setTimeout mínimo para não bloquear renderização
        setTimeout(() => {
          fetchUser(storedToken);
        }, 0);
      }
    } else {
      // Sem token, não precisa fazer requisição - libera renderização imediatamente
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = useCallback(async (_authToken: string) => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
