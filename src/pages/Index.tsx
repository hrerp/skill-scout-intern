
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import InternForm from '../components/InternForm';
import AdminDashboard from '../components/AdminDashboard';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <InternForm />;
};

export default Index;
