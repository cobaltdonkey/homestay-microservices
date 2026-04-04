import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase';

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
  login: (email: string, password: string, firstName?: string, lastName?: string, phoneNumber?: string, role?: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('staylah_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('staylah_user');
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
      let userDataToSet = null;

      // Registration flow (sign up)
      if (firstName && lastName) {
        const newUserId = crypto.randomUUID();
        const { error: regError } = await supabase
          .schema('user_db')
          .from('user_profile')
          .insert({
            user_id: newUserId,
            name: `${firstName} ${lastName}`,
            email,
            password,
            phone_number: phoneNumber ?? '+6500000000',
            role: role ?? 'guest',
          });

        if (regError) {
          console.error(regError);
          if (regError.message.includes('duplicate key') || regError.message.includes('unique constraint')) {
            alert('The email is used please use different email');
          } else {
            alert('Registration failed: ' + regError.message);
          }
          return { success: false };
        }

        userDataToSet = {
          userId: newUserId,
          name: `${firstName} ${lastName}`,
          email,
          role: role ?? 'guest',
          initials: firstName[0].toUpperCase() + lastName[0].toUpperCase(),
          sessionId: crypto.randomUUID(),
        };

      } else {
        // Login flow
        const { data, error } = await supabase
          .schema('user_db')
          .from('user_profile')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          alert('Login failed. Check your email and password.');
          return { success: false };
        }

        const nameParts = data.name.split(' ');
        const initials = nameParts.length > 1
          ? nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase()
          : data.name[0].toUpperCase();

        userDataToSet = {
          userId: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
          initials,
          sessionId: crypto.randomUUID(),
        };
      }

      if (userDataToSet) {
        // Record the session in the database
        const { error: sessionError } = await supabase
          .schema('user_db')
          .from('user_session')
          .insert({
            session_id: userDataToSet.sessionId,
            user_id: userDataToSet.userId,
            is_active: true,
          });

        if (sessionError) {
          console.error('Failed to log session in database:', sessionError);
        }

        setUser(userDataToSet);
        setIsLoggedIn(true);
        localStorage.setItem('staylah_user', JSON.stringify(userDataToSet));
        return { success: true, role: userDataToSet.role };
      }
      return { success: false };

    } catch (err) {
      console.error('Auth error:', err);
      alert('Authentication error via Supabase.');
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      if (user?.sessionId) {
        // Mark session as inactive in the database
        await supabase
          .schema('user_db')
          .from('user_session')
          .update({ 
            is_active: false,
            logged_out_at: new Date().toISOString()
          })
          .eq('session_id', user.sessionId);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('staylah_user');
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
