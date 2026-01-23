import { Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import { AdminPage } from './components/AdminPage'
import { SettingsPage } from './components/SettingsPage'
import UserDashboard from './components/UserDashboard'
import GeneralDashboard from './components/GeneralDashboard'
import LoginPage from './components/LoginPage'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<SettingsPage />} />
          <Route path="general" element={<GeneralDashboard />} />
          <Route path="user" element={<UserDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App