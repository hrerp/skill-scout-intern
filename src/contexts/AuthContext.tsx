
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('marzelet_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (userData.role === 'admin') {
          loadInterns();
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('marzelet_user');
      }
    }
    setLoading(false);
  }, []);

  const loadInterns = async () => {
    try {
      console.log('Loading interns data...');
      // For now, we'll use localStorage to store intern data
      // This ensures data persistence across sessions
      const storedInterns = localStorage.getItem('marzelet_interns');
      if (storedInterns) {
        const internsData = JSON.parse(storedInterns);
        console.log('Loaded interns from storage:', internsData);
        setInterns(internsData);
      }
    } catch (error) {
      console.error('Error loading interns:', error);
    }
  };

  const login = async (role: 'user' | 'admin', password?: string, userName?: string): Promise<boolean> => {
    console.log('Login attempt:', role, userName ? `user: ${userName}` : 'admin');
    
    if (role === 'admin') {
      if (password === '231805') {
        const adminUser: AuthUser = {
          id: 'admin-001',
          name: 'Admin',
          role: 'admin'
        };
        setUser(adminUser);
        localStorage.setItem('marzelet_user', JSON.stringify(adminUser));
        await loadInterns();
        console.log('Admin login successful');
        return true;
      }
      return false;
    } else {
      if (userName && userName.trim()) {
        const internUser: AuthUser = {
          id: `intern-${Date.now()}`,
          name: userName.trim(),
          role: 'user'
        };
        setUser(internUser);
        localStorage.setItem('marzelet_user', JSON.stringify(internUser));
        console.log('Intern login successful for:', userName);
        return true;
      }
      return false;
    }
  };

  const logout = async () => {
    console.log('Logging out...');
    localStorage.removeItem('marzelet_user');
    setUser(null);
    setInterns([]);
  };

  const submitInternData = async (data: Omit<Intern, 'id' | 'submittedAt'>) => {
    if (!user) {
      console.error('No user session for submitting data');
      return;
    }

    try {
      console.log('Submitting intern data:', data);
      const internData: Intern = {
        id: `intern-data-${Date.now()}`,
        ...data,
        submittedAt: new Date().toISOString()
      };

      // Get existing interns from localStorage
      const storedInterns = localStorage.getItem('marzelet_interns');
      let existingInterns: Intern[] = [];
      if (storedInterns) {
        existingInterns = JSON.parse(storedInterns);
      }

      // Check if intern with this name already exists
      const existingIndex = existingInterns.findIndex(intern => intern.name === data.name);
      
      if (existingIndex >= 0) {
        // Update existing intern
        existingInterns[existingIndex] = internData;
        console.log('Updated existing intern data');
      } else {
        // Add new intern
        existingInterns.push(internData);
        console.log('Added new intern data');
      }

      // Save back to localStorage
      localStorage.setItem('marzelet_interns', JSON.stringify(existingInterns));
      
      // Update local state
      setInterns(existingInterns);
      
      console.log('Intern data submitted successfully');
    } catch (error) {
      console.error('Error submitting intern data:', error);
    }
  };

  const getCurrentUserData = (): Intern | null => {
    if (!user || user.role !== 'user') return null;
    return interns.find(intern => intern.name === user.name) || null;
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
