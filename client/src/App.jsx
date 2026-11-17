import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Profile } from './pages/profile/Profile';
import { Dashboard } from './pages/dashboard/Dashboard';
import { SkillGap } from './pages/skill_gap/SkillGap';
import { ActionPlan } from './pages/action_plan/ActionPlan';
import { Interview } from './pages/interview/Interview';
import { Mentor } from './pages/mentor/Mentor';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="skill-gap" element={<SkillGap />} />
          <Route path="action-plan" element={<ActionPlan />} />
          <Route path="interview" element={<Interview />} />
          <Route path="mentor" element={<Mentor />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
