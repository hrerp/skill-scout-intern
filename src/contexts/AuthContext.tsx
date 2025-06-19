import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  name: string;
  role: 'user' | 'admin';
}

interface Intern {
  id: string;
  name: string;
  college: string;
  photo: string;
  languages: {
    name: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Expert';
    expertConfirmed?: boolean;
  }[];
  submittedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  interns: Intern[];
  login: (role: 'user' | 'admin', password?: string, userName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  submitInternData: (data: Omit<Intern, 'id' | 'submittedAt'>) => Promise<void>;
  getCurrentUserData: () => Intern | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          // Set user based on session
          const isAdmin = session.user.email === 'admin@admin.com';
          setUser({
            id: session.user.id,
            name: isAdmin ? 'Admin' : session.user.email || 'User',
            role: isAdmin ? 'admin' : 'user'
          });
          
          // Load interns data for admin users
          if (isAdmin) {
            await loadInterns();
          }
        } else {
          setUser(null);
          setInterns([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const isAdmin = session.user.email === 'admin@admin.com';
        setUser({
          id: session.user.id,
          name: isAdmin ? 'Admin' : session.user.email || 'User',
          role: isAdmin ? 'admin' : 'user'
        });
        setSession(session);
        
        if (isAdmin) {
          loadInterns();
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadInterns = async () => {
    try {
      const { data, error } = await supabase
        .from('interns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading interns:', error);
        return;
      }

      const formattedInterns: Intern[] = data.map(intern => ({
        id: intern.id,
        name: intern.name,
        college: intern.college,
        photo: intern.photo || '',
        languages: Array.isArray(intern.languages) ? intern.languages as {
          name: string;
          proficiency: 'Beginner' | 'Intermediate' | 'Expert';
          expertConfirmed?: boolean;
        }[] : [],
        submittedAt: intern.created_at
      }));

      setInterns(formattedInterns);
    } catch (error) {
      console.error('Error loading interns:', error);
    }
  };

  const login = async (role: 'user' | 'admin', password?: string, userName?: string): Promise<boolean> => {
    if (role === 'admin') {
      if (password === '231805') {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: 'admin@admin.com',
            password: 'admin123456'
          });
          
          if (error) {
            // Try to sign up admin if doesn't exist
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin@admin.com',
              password: 'admin123456'
            });
            
            if (!signUpError) {
              // Sign in after signup
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: 'admin@admin.com',
                password: 'admin123456'
              });
              return !signInError;
            }
            return false;
          }
          return true;
        } catch (error) {
          console.error('Admin login error:', error);
          return false;
        }
      }
      return false;
    } else {
      if (userName && userName.trim()) {
        try {
          const email = `${userName.toLowerCase().replace(/\s+/g, '')}@intern.local`;
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password: 'intern123'
          });
          
          if (error) {
            // Try to sign up user if doesn't exist
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: 'intern123',
              options: {
                emailRedirectTo: `${window.location.origin}/`
              }
            });
            
            if (!signUpError) {
              // Sign in after signup
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: 'intern123'
              });
              return !signInError;
            }
            return false;
          }
          return true;
        } catch (error) {
          console.error('User login error:', error);
          return false;
        }
      }
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInterns([]);
    setSession(null);
  };

  const submitInternData = async (data: Omit<Intern, 'id' | 'submittedAt'>) => {
    if (!session?.user) return;

    try {
      const internData = {
        user_id: session.user.id,
        name: data.name,
        college: data.college,
        photo: data.photo,
        languages: data.languages
      };

      // Check if user already has data
      const { data: existingData } = await supabase
        .from('interns')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('interns')
          .update(internData)
          .eq('user_id', session.user.id);

        if (error) {
          console.error('Error updating intern data:', error);
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('interns')
          .insert(internData);

        if (error) {
          console.error('Error inserting intern data:', error);
          return;
        }
      }

      // Reload data if admin
      if (user?.role === 'admin') {
        await loadInterns();
      }
    } catch (error) {
      console.error('Error submitting intern data:', error);
    }
  };

  const getCurrentUserData = (): Intern | null => {
    if (!user || user.role !== 'user') return null;
    return interns.find(intern => intern.id === user.id) || null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      interns,
      login,
      logout,
      submitInternData,
      getCurrentUserData,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
