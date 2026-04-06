import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api-mongodb";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const token = localStorage.getItem("pneumax_token");
    if (token) {
      // Validate token by getting user profile
      loadUserProfile();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await api.auth.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Invalid token, remove it
      localStorage.removeItem("pneumax_token");
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      setLoading(true);
      await api.auth.register({ email, password, firstName, lastName });
      return { ok: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { ok: false, error: getErrorMessage(error, "Signup failed") };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await api.auth.login({ email, password });
      
      // User and token are stored in response
      const user = response.user;
      setUser(user);
      
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: getErrorMessage(error, "Login failed") };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await api.auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
