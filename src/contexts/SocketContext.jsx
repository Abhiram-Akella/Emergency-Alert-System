import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { API_URL } from '../config/constants'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const { isAuthenticated, user } = useAuth()
  
  useEffect(() => {
    let socketInstance = null;
    
    if (isAuthenticated && user) {
      // Connect to socket server
      try {
        socketInstance = io(API_URL, {
          withCredentials: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000
        })
        
        socketInstance.on('connect', () => {
          console.log('Socket connected')
          // Join user's room immediately after connection
          if (user._id) {
            socketInstance.emit('join-room', user._id)
            console.log('Joined room:', user._id)
          }
        })
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected')
        })
        
        socketInstance.on('connect_error', (error) => {
          console.log('Socket connection error:', error.message)
        })

        // Create a debounced toast function with message tracking
        const toastTracker = new Set()
        const showToast = (message, type = 'info') => {
          if (!message) return; // Skip if no message
          
          const toastKey = `${type}-${message}`
          if (!toastTracker.has(toastKey)) {
            toastTracker.add(toastKey)
            toast[type](message, {
              toastId: toastKey,
              onClose: () => {
                // Remove from tracker after toast is closed
                setTimeout(() => {
                  toastTracker.delete(toastKey)
                }, 300)
              }
            })
          }
        }

        // Handle notifications
        const handleNotification = (data) => {
          if (!data || !data.message) return; // Skip if no message
          
          if (!socketInstance.connected) {
            const storedNotifications = JSON.parse(localStorage.getItem(`notifications_${user._id}`) || '[]')
            storedNotifications.push(data)
            localStorage.setItem(`notifications_${user._id}`, JSON.stringify(storedNotifications))
          } else {
            showToast(data.message)
          }
        }

        // Add notification listeners
        socketInstance.on('reportUpdated', handleNotification)
        socketInstance.on('reportAssigned', handleNotification)
        socketInstance.on('reportStatusUpdated', handleNotification)
        socketInstance.on('nearby-alert', handleNotification)
        
        setSocket(socketInstance)

        // Cleanup
        return () => {
          if (socketInstance) {
            socketInstance.off('reportUpdated')
            socketInstance.off('reportAssigned')
            socketInstance.off('reportStatusUpdated')
            socketInstance.off('nearby-alert')
            socketInstance.disconnect()
          }
        }
      } catch (err) {
        console.error('Socket initialization error:', err)
      }
    }
  }, [isAuthenticated, user])
  
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}