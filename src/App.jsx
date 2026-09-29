import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CreateProject from './pages/CreateProject';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import MyRequests from './pages/MyRequests';
import MyInvitations from './pages/MyInvitations';
import MyTeams from './pages/MyTeams';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/projects" element={<Projects myProjectsMode={false} />} />
            <Route 
              path="/my-projects" 
              element={
                <ProtectedRoute>
                  <Projects myProjectsMode={true} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-teams" 
              element={
                <ProtectedRoute>
                  <MyTeams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id" 
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-project" 
              element={
                <ProtectedRoute>
                  <CreateProject />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-requests" 
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-invitations" 
              element={
                <ProtectedRoute>
                  <MyInvitations />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
