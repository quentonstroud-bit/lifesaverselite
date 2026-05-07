import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public pages
import Landing from './pages/Landing'
import Apply from './pages/Apply'
import AgentEnroll from './pages/AgentEnroll'
import Login from './pages/Login'

// Dashboards
import LifeSaverDashboard from './pages/dashboard/LifeSaverDashboard'
import AgentDashboard from './pages/dashboard/AgentDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import Training from './pages/dashboard/Training'

function ProtectedRoute({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/agents/enroll" element={<AgentEnroll />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard/lifesaver/*" element={
        <ProtectedRoute role="lifesaver">
          <LifeSaverDashboard />
        </ProtectedRoute>
      } />

      <Route path="/dashboard/lifesaver/training" element={
        <ProtectedRoute role="lifesaver">
          <Training />
        </ProtectedRoute>
      } />

      <Route path="/dashboard/agent/*" element={
        <ProtectedRoute role="agent">
          <AgentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/dashboard/admin/*" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
