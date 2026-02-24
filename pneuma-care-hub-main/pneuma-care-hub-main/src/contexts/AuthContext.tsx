import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string, firstName: string, lastName: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pneumax_current_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const signup = (email: string, password: string, firstName: string, lastName: string): boolean => {
    const users = JSON.parse(localStorage.getItem("pneumax_users") || "{}");
    if (users[email]) return false;
    users[email] = { password, firstName, lastName };
    localStorage.setItem("pneumax_users", JSON.stringify(users));
    const u = { email, firstName, lastName };
    setUser(u);
    localStorage.setItem("pneumax_current_user", JSON.stringify(u));
    return true;
  };

  const login = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("pneumax_users") || "{}");
    const found = users[email];
    if (!found || found.password !== password) return false;
    const u = { email, firstName: found.firstName, lastName: found.lastName };
    setUser(u);
    localStorage.setItem("pneumax_current_user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pneumax_current_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
