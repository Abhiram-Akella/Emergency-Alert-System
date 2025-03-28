import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { mockAPI } from '../../services/api'
import EmergencyMap from '../../components/EmergencyMap'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import StatCard from '../../components/StatCard'
import Chatbot from '../../components/Chatbot'
import { FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiPhone, FiBookOpen } from 'react-icons/fi'
import { toast } from 'react-toastify'

const UserDashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const fetchUserReports = useCallback(async () => {
    try {
      const data = await mockAPI.getUserReports()
      const sortedReports = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setReports(sortedReports)
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserReports()
  }, [fetchUserReports])

  const handleWithdrawReport = async (reportId) => {
    try {
      await mockAPI.withdrawReport(reportId)
      setReports(reports.filter(report => report._id !== reportId))
      toast.success('Report withdrawn successfully')
    } catch (err) {
      toast.error('Failed to withdraw report')
      console.error(err)
    }
  }

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      const handleReportUpdate = () => {
        fetchUserReports()
      }

      // Listen for all relevant events that could affect reports
      socket.on('reportUpdated', handleReportUpdate)
      socket.on('reportAssigned', handleReportUpdate)
      socket.on('reportStatusUpdated', handleReportUpdate)
      socket.on('reportWithdrawn', handleReportUpdate)

      return () => {
        socket.off('reportUpdated', handleReportUpdate)
        socket.off('reportAssigned', handleReportUpdate)
        socket.off('reportStatusUpdated', handleReportUpdate)
        socket.off('reportWithdrawn', handleReportUpdate)
      }
    }
  }, [socket, fetchUserReports])

  // Quick Actions
  const quickActions = [
    {
      title: 'Report Emergency',
      description: 'Create a new emergency report',
      icon: <FiAlertCircle className="h-6 w-6" />,
      link: '/user/create-report',
      color: 'bg-red-100 text-red-700'
    },
    {
      title: 'Safety Guidelines',
      description: 'Emergency response guides',
      icon: <FiBookOpen className="h-6 w-6" />,
      link: '/user/safety-resources',
      color: 'bg-blue-100 text-blue-700'
    }
  ]

  // Calculate stats
  const pendingReports = reports.filter(report => report.status === 'Pending').length
  const inProgressReports = reports.filter(report => 
    report.status === 'Assigned' || report.status === 'In Progress'
  ).length
  const resolvedReports = reports.filter(report => report.status === 'Resolved').length

  // Filter reports for map
  const filteredReports = showActiveOnly 
    ? reports.filter(report => report.status !== 'Resolved')
    : reports

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
       <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name?user.name:"User"}!</h1>
        <p className="text-gray-600 mt-1">Stay safe and report any emergencies immediately.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className={`inline-block p-3 rounded-lg ${action.color} mb-4`}>
              {action.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
            <p className="text-gray-600 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Active Reports" 
          value={pendingReports + inProgressReports} 
          icon={<FiMapPin className="h-5 w-5" />} 
          color="primary"
        />
        <StatCard 
          title="In Progress" 
          value={inProgressReports} 
          icon={<FiClock className="h-5 w-5" />} 
          color="warning"
        />
        <StatCard 
          title="Resolved" 
          value={resolvedReports} 
          icon={<FiCheckCircle className="h-5 w-5" />} 
          color="success"
        />
      </div>

      {/* Map and Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Emergency Map</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  !showActiveOnly
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setShowActiveOnly(false)}
              >
                All Reports
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  showActiveOnly
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setShowActiveOnly(true)}
              >
                Active Only
              </button>
            </div>
          </div>
          {reports.length > 0 ? (
            <EmergencyMap reports={filteredReports} height="400px" />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No emergency reports to display</p>
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            <Link to="/user/reports" className="text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <p>Loading reports...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">No reports yet</p>
              <Link to="/user/create-report" className="btn btn-primary mt-4">
                Create First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.slice(0, 3).map(report => (
                <EmergencyReportCard 
                  key={report._id} 
                  report={report}
                  onWithdraw={handleWithdrawReport}
                  actions={
                    <Link 
                      to="/user/reports" 
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}

export default UserDashboard