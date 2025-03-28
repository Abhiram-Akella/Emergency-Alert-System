import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useSocket } from './contexts/SocketContext'
import { toast } from 'react-toastify'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import UserDashboard from './pages/user/Dashboard'
import CreateReport from './pages/user/CreateReport'
import UserReports from './pages/user/UserReports'
import SafetyResources from './pages/user/SafetyResources'
import AdminDashboard from './pages/admin/Dashboard'
import AdminReports from './pages/admin/Reports'
import Analytics from './pages/admin/Analytics'
import ResponderDashboard from './pages/responder/Dashboard'
import ResponderReports from './pages/responder/Reports'
import NotFound from './pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // For admin and responder, allow access to user dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Special case: allow admin to access responder and user dashboards
    if (user.role === 'admin' && (allowedRoles.includes('responder') || allowedRoles.includes('user'))) {
      return children
    }
    // Special case: allow responder to access user dashboard
    if (user.role === 'responder' && allowedRoles.includes('user')) {
      return children
    }
    // Default redirect based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'responder') {
      return <Navigate to="/responder/dashboard" replace />
    } else {
      return <Navigate to="/user/dashboard" replace />
    }
  }
  
  return children
}

function App() {
  const { socket } = useSocket()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (isAuthenticated && user) {
      if (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/register') {
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else if (user.role === 'responder') {
          navigate('/responder/dashboard', { replace: true })
        } else {
          navigate('/user/dashboard', { replace: true })
        }
      }
    }
  }, [isAuthenticated, user, navigate])
  
  useEffect(() => {
    if (socket) {
      socket.off('newEmergency')
      socket.off('reportUpdated')
      socket.off('reportAssigned')
      socket.off('reportStatusUpdated')

      socket.on('newEmergency', (data) => {
        toast.error(data.message, {
          toastId: 'newEmergency'
        })
      })

      socket.on('reportUpdated', (data) => {
        toast.info(data.message, {
          toastId: 'reportUpdated'
        })
      })
      
      socket.on('reportAssigned', (data) => {
        toast.info(data.message, {
          toastId: 'reportAssigned'
        })
      })
      
      socket.on('reportStatusUpdated', (data) => {
        toast.info(data.message, {
          toastId: 'reportStatusUpdated'
        })
      })
      
      return () => {
        socket.off('reportUpdated')
        socket.off('reportAssigned')
        socket.off('reportStatusUpdated')
      }
    }
  }, [socket])
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      
      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* User Routes - Accessible by all roles */}
        <Route path="/user/dashboard" element={
          <ProtectedRoute allowedRoles={['user', 'responder', 'admin']}>
            <UserDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/user/create-report" element={
          <ProtectedRoute allowedRoles={['user', 'responder', 'admin']}>
            <CreateReport />
          </ProtectedRoute>
        } />
        
        <Route path="/user/reports" element={
          <ProtectedRoute allowedRoles={['user', 'responder', 'admin']}>
            <UserReports />
          </ProtectedRoute>
        } />

        <Route path="/user/safety-resources" element={
          <ProtectedRoute allowedRoles={['user', 'responder', 'admin']}>
            <SafetyResources />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        } />

        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        } />
        
        {/* Responder Routes - Also accessible by admin */}
        <Route path="/responder/dashboard" element={
          <ProtectedRoute allowedRoles={['responder', 'admin']}>
            <ResponderDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/responder/reports" element={
          <ProtectedRoute allowedRoles={['responder', 'admin']}>
            <ResponderReports />
          </ProtectedRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App