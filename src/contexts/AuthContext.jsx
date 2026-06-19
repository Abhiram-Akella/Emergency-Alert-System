import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          setIsLoading(false)
          return
        }

        // Try to get user data from backend
        const response = await mockAPI.getLoggedUser()
        if (response) {
          setUser(response)
          setIsAuthenticated(true)
        } else {
          // If backend check fails, clear localStorage
          localStorage.removeItem('user')
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (err) {
        // If backend check fails, clear localStorage
        console.log('Not authenticated')
        localStorage.removeItem('user')
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  // Register user
  const register = async (userData) => {
    setError(null)
    try {
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              
              const userDataWithLocation = {
                ...userData,
                latitude,
                longitude
              }
              
              try {
                const response = await mockAPI.register(userDataWithLocation)
                resolve({ success: true })
              } catch (err) {
                const errorMessage = err.response?.data?.error || "Registration failed"
                setError(errorMessage)
                resolve({ success: false, error: errorMessage })
              }
            },
            (error) => {
              console.error("Error getting location:", error)
              setError("Location access is required for registration")
              resolve({ success: false, error: "Location access is required" })
            }
          )
        })
      } else {
        setError("Geolocation is not supported by this browser")
        return { success: false, error: "Geolocation not supported" }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Registration failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  // Login user
  const login = async (credentials) => {
    setError(null)
    try {
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              
              const credentialsWithLocation = {
                ...credentials,
                latitude,
                longitude
              }
              
              try {
                const response = await mockAPI.login(credentialsWithLocation)
                // Update state with user data from response
                setUser(response.user)
                setIsAuthenticated(true)
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(response.user))
                
                // Redirect based on role
                if (response.user.role === 'admin') {
                  navigate('/admin/dashboard')
                } else if (response.user.role === 'responder') {
                  navigate('/responder/dashboard')
                } else {
                  navigate('/user/dashboard')
                }
                
                resolve({ success: true })
              } catch (err) {
                const errorMessage = err.response?.data?.error || "Login failed"
                setError(errorMessage)
                resolve({ success: false, error: errorMessage })
              }
            },
            (error) => {
              console.error("Error getting location:", error)
              setError("Location access is required for login")
              resolve({ success: false, error: "Location access is required" })
            }
          )
        })
      } else {
        setError("Geolocation is not supported by this browser")
        return { success: false, error: "Geolocation not supported" }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Login failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  // Logout user
  const logout = async () => {
    try {
      await mockAPI.logout()
      
      // Clear state and localStorage
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('user')
      
      // Redirect to login
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
      // Still clear state and redirect even if logout API fails
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('user')
      navigate('/')
    }
  }
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}