import { createContext, useContext, useState, useEffect } from 'react'
import { useSocket } from './SocketContext'

const NotificationsContext = createContext()

export const useNotifications = () => useContext(NotificationsContext)

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const { socket } = useSocket()

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        setNotifications(prev => [{
          message: data.message,
          timestamp: new Date().toISOString()
        }, ...prev])
      }

      socket.on('reportUpdated', handleNotification)
      socket.on('reportAssigned', handleNotification)
      socket.on('reportStatusUpdated', handleNotification)
      socket.on('nearby-alert', handleNotification)

      return () => {
        socket.off('reportUpdated', handleNotification)
        socket.off('reportAssigned', handleNotification)
        socket.off('reportStatusUpdated', handleNotification)
        socket.off('nearby-alert', handleNotification)
      }
    }
  }, [socket])

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationsContext.Provider value={{ notifications, clearNotifications }}>
      {children}
    </NotificationsContext.Provider>
  )
}