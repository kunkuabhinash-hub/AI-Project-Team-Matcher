import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If not authenticated, redirect to login page
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
