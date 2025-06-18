
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
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
  user: User | null;
  interns: Intern[];
  login: (role: 'user' | 'admin', password?: string, userName?: string) => boolean;
  logout: () => void;
  submitInternData: (data: Omit<Intern, 'id' | 'submittedAt'>) => void;
  getCurrentUserData: () => Intern | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [interns, setInterns] = useState<Intern[]>([]);

  const login = (role: 'user' | 'admin', password?: string, userName?: string): boolean => {
    if (role === 'admin') {
      if (password === '231805') {
        setUser({ id: 'admin', name: 'Admin', role: 'admin' });
        return true;
      }
      return false;
    } else {
      if (userName && userName.trim()) {
        setUser({ id: userName, name: userName, role: 'user' });
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const submitInternData = (data: Omit<Intern, 'id' | 'submittedAt'>) => {
    const newIntern: Intern = {
      ...data,
      id: user?.id || '',
      submittedAt: new Date().toISOString(),
    };
    
    setInterns(prev => {
      const existingIndex = prev.findIndex(intern => intern.id === newIntern.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newIntern;
        return updated;
      }
      return [...prev, newIntern];
    });
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
      getCurrentUserData
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
