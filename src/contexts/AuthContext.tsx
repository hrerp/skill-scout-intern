
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

// Use valid email addresses for authentication
const SHARED_INTERN_EMAIL = 'shared.intern@marzelet.com';
const SHARED_INTERN_PASSWORD = 'intern123456';
const ADMIN_EMAIL = 'admin@marzelet.com';
const ADMIN_PASSWORD = 'admin231805';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        if (session?.user) {
          // Set user based on session
          const isAdmin = session.user.email === ADMIN_EMAIL;
          setUser({
            id: session.user.id,
            name: isAdmin ? 'Admin' : session.user.user_metadata?.display_name || 'User',
            role: isAdmin ? 'admin' : 'user'
          });
          
          // Load interns data for admin users
          if (isAdmin) {
            setTimeout(() => {
              loadInterns();
            }, 0);
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
      console.log('Initial session check:', session?.user?.email);
      if (session?.user) {
        const isAdmin = session.user.email === ADMIN_EMAIL;
        setUser({
          id: session.user.id,
          name: isAdmin ? 'Admin' : session.user.user_metadata?.display_name || 'User',
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
      console.log('Loading interns data...');
      const { data, error } = await supabase
        .from('interns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading interns:', error);
        return;
      }

      console.log('Loaded interns:', data);
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
    console.log('Login attempt:', role, userName ? `user: ${userName}` : 'admin');
    
    if (role === 'admin') {
      if (password === '231805') {
        try {
          // First try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
          });
          
          if (signInError) {
            console.log('Admin sign in failed, trying to create account:', signInError.message);
            // Try to sign up admin if doesn't exist
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  display_name: 'Admin'
                }
              }
            });
            
            if (signUpError) {
              console.error('Admin sign up error:', signUpError);
              return false;
            }
            
            // If sign up successful, try to sign in again
            if (signUpData.user) {
              const { error: retrySignInError } = await supabase.auth.signInWithPassword({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
              });
              if (retrySignInError) {
                console.error('Admin retry sign in error:', retrySignInError);
                return false;
              }
            }
          }
          
          console.log('Admin login successful');
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
          // First try to sign in with shared intern account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: SHARED_INTERN_EMAIL,
            password: SHARED_INTERN_PASSWORD
          });
          
          if (signInError) {
            console.log('Intern sign in failed, trying to create shared account:', signInError.message);
            // Try to sign up shared intern account if doesn't exist
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: SHARED_INTERN_EMAIL,
              password: SHARED_INTERN_PASSWORD,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  display_name: userName
                }
              }
            });
            
            if (signUpError) {
              console.error('Intern sign up error:', signUpError);
              return false;
            }
            
            // If sign up successful, try to sign in again
            if (signUpData.user) {
              const { error: retrySignInError } = await supabase.auth.signInWithPassword({
                email: SHARED_INTERN_EMAIL,
                password: SHARED_INTERN_PASSWORD
              });
              if (retrySignInError) {
                console.error('Intern retry sign in error:', retrySignInError);
                return false;
              }
            }
          }
          
          // Update the user metadata with the current user's name
          await supabase.auth.updateUser({
            data: { display_name: userName }
          });
          
          console.log('Intern login successful for:', userName);
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
    console.log('Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setInterns([]);
    setSession(null);
  };

  const submitInternData = async (data: Omit<Intern, 'id' | 'submittedAt'>) => {
    if (!session?.user) {
      console.error('No user session for submitting data');
      return;
    }

    try {
      console.log('Submitting intern data:', data);
      const internData = {
        user_id: session.user.id,
        name: data.name,
        college: data.college,
        photo: data.photo,
        languages: data.languages
      };

      // Check if user already has data with this name
      const { data: existingData } = await supabase
        .from('interns')
        .select('*')
        .eq('name', data.name)
        .single();

      if (existingData) {
        console.log('Updating existing intern data');
        // Update existing record
        const { error } = await supabase
          .from('interns')
          .update(internData)
          .eq('name', data.name);

        if (error) {
          console.error('Error updating intern data:', error);
          return;
        }
      } else {
        console.log('Inserting new intern data');
        // Insert new record
        const { error } = await supabase
          .from('interns')
          .insert(internData);

        if (error) {
          console.error('Error inserting intern data:', error);
          return;
        }
      }

      console.log('Intern data submitted successfully');
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
    const currentUserName = session?.user?.user_metadata?.display_name;
    return interns.find(intern => intern.name === currentUserName) || null;
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
