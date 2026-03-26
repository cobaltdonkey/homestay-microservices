import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  sessionId: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string, firstName?: string, lastName?: string, phoneNumber?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('secondhome_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('secondhome_user');
      }
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    role?: string
  ) => {
    try {
      // Registration flow (sign up)
      if (firstName && lastName) {
        const regRes = await fetch('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${firstName} ${lastName}`,
            email,
            password,
            phoneNumber: phoneNumber ?? '+6500000000',
            role: role ?? 'guest',
          }),
        });
        if (!regRes.ok && regRes.status !== 409) {
          const err = await regRes.json();
          alert(err.message ?? 'Registration failed');
          return;
        }
      }

      // Login flow
      const res = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || json.code !== 200) {
        alert(json.message ?? 'Login failed. Check your email and password.');
        return;
      }

      const { userId, name, role: userRole, sessionId } = json.data;
      const initials = name
        ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

      const userData: User = { userId, name, email, role: userRole, initials, sessionId };
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem('secondhome_user', JSON.stringify(userData));

    } catch (err) {
      console.error('Auth error:', err);
      alert('Authentication error. Is the backend running?');
    }
  };

  const logout = async () => {
    try {
      if (user?.sessionId) {
        await fetch('/users/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: user.sessionId }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('secondhome_user');
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
