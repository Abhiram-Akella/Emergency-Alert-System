import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { mockAPI } from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'
import EmergencyMap from '../../components/EmergencyMap'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import ImageGallery from '../../components/ImageGallery'
import { FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiNavigation } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const ResponderDashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [reports, setReports] = useState({ resolvedReports: [], unresolvedReports: [] })
  const [availableReports, setAvailableReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [destinationCoords, setDestinationCoords] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [assignedData, availableData] = await Promise.all([
        mockAPI.getAssignedReports(),
        mockAPI.getAvailableReports()
      ])
      setReports(assignedData)
      setAvailableReports(availableData)

      // Update selected report if it exists in the new data
      if (selectedReport) {
        const updatedReport = assignedData.unresolvedReports.find(r => r._id === selectedReport._id) ||
                            assignedData.resolvedReports.find(r => r._id === selectedReport._id)
        setSelectedReport(updatedReport || null)
      }
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedReport])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (socket) {
      const handleNewEmergency = (data) => {
        fetchData()
        toast.message(data.message, { toastId: 'newEmergency' })
      }

      const handleReportUpdate = (data) => {
        fetchData()
        toast.info(data.message)
      }
      const handleReportWithdrawn = () => {
        fetchData()
        toast.info("Report has been withdrawn");
      }

      socket.on('newEmergency', handleNewEmergency)
      socket.on('reportUpdated', handleReportUpdate)
      socket.on('reportAssigned', handleReportUpdate)
      socket.on('reportStatusUpdated', handleReportUpdate)
      socket.on('reportWithdrawn', handleReportWithdrawn)

      return () => {
        socket.off('newEmergency', handleNewEmergency)
        socket.off('reportUpdated', handleReportUpdate)
        socket.off('reportAssigned', handleReportUpdate)
        socket.off('reportStatusUpdated', handleReportUpdate)
        socket.off('reportWithdrawn', handleReportWithdrawn)
      }
    }
  }, [socket, fetchData])

  const handleAcceptReport = async (reportId) => {
    try {
      await mockAPI.acceptReport(reportId)
      await fetchData()
    } catch (err) {
      toast.error('Failed to accept report')
      console.error(err)
    }
  }

  const handleRejectReport = async (reportId) => {
    try {
      await mockAPI.rejectReport(reportId)
      setAvailableReports(prev => prev.filter(report => report._id !== reportId))
      toast.info('Report rejected')
    } catch (err) {
      toast.error('Failed to reject report')
      console.error(err)
    }
  }

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdatingStatus(true)
    try {
      await mockAPI.updateReportStatus(reportId, newStatus)
      await fetchData()
    } catch (err) {
      toast.error('Failed to update report status')
      console.error(err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleGetDirections = (latitude, longitude) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setDestinationCoords({ latitude, longitude })
    setShowNavigation(true)
  }

  // Calculate stats
  const assignedReports = reports.unresolvedReports.filter(report => report.status === 'Assigned').length
  const inProgressReports = reports.unresolvedReports.filter(report => report.status === 'In Progress').length
  const resolvedReportsCount = reports.resolvedReports.length
  const totalReports = assignedReports + inProgressReports + resolvedReportsCount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Responder'}</h1>
        <p className="text-gray-600 mt-1">Monitor and respond to assigned emergencies</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Available Reports */}
      {availableReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Available Emergency Reports</h2>
            <p className="mt-1 text-sm text-gray-500">New reports that need attention</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4">
              {availableReports.map(report => (
                <EmergencyReportCard
                  key={report._id}
                  report={report}
                  actions={
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptReport(report._id)}
                        className="btn btn-success btn-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectReport(report._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                      <div className="text-sm text-gray-500">
                        Distance: {(report.distance / 1000).toFixed(2)} km
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <FiAlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-900">Active Emergencies</h3>
              <p className="mt-1 text-red-600">{assignedReports + inProgressReports} reports need attention</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-green-900">Resolved</h3>
              <p className="mt-1 text-green-600">{resolvedReportsCount} reports completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map and Active Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Emergency Locations</h2>
              <p className="mt-1 text-sm text-gray-500">View and track active emergency locations</p>
            </div>
            <div className="p-4">
              {reports.unresolvedReports.length > 0 ? (
                <EmergencyMap 
                  reports={reports.unresolvedReports} 
                  height="400px"
                  onMarkerClick={setSelectedReport}
                  showNavigation={showNavigation}
                  destinationCoords={destinationCoords}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">No active emergency reports</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Reports */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Assignments</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your current emergency assignments</p>
            </div>
            <div className="p-4">
              {reports.unresolvedReports.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">No active assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.unresolvedReports.map(report => (
                    <EmergencyReportCard 
                      key={report._id} 
                      report={report}
                      actions={
                        <div className="flex flex-wrap gap-2">
                          {report.status === 'Assigned' && (
                            <button
                              onClick={() => handleUpdateStatus(report._id, 'In Progress')}
                              disabled={updatingStatus}
                              className="btn btn-warning btn-sm"
                            >
                              Start Response
                            </button>
                          )}
                          {(report.status === 'Assigned' || report.status === 'In Progress') && (
                            <button
                              onClick={() => handleUpdateStatus(report._id, 'Resolved')}
                              disabled={updatingStatus}
                              className="btn btn-success btn-sm"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="btn btn-primary btn-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleGetDirections(report.latitude, report.longitude)}
                            className="btn btn-info btn-sm"
                          >
                            <FiNavigation className="h-4 w-4 mr-1 inline-block" />
                            Navigate
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Report Details */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
                <p className="mt-1 text-sm text-gray-500">View and manage selected report</p>
              </div>
              <div className="p-4">
                {selectedReport ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <span className={`ml-2 badge badge-${selectedReport.type.toLowerCase()}`}>
                        {selectedReport.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`ml-2 badge badge-${selectedReport.status.toLowerCase().replace(' ', '-')}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="mt-1 text-gray-700">{selectedReport.description}</p>
                    </div>
                    {selectedReport.media && selectedReport.media.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Images</h4>
                        <ImageGallery images={selectedReport.media} />
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="mt-1 text-gray-700">
                        {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                      </p>
                      <button 
                        className="mt-2 btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                        onClick={() => handleGetDirections(selectedReport.latitude, selectedReport.longitude)}
                      >
                        <FiNavigation className="h-4 w-4" />
                        Get Directions
                      </button>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Reported By:</span>
                      <p className="mt-1 text-gray-700">{selectedReport.user?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Reported On:</span>
                      <p className="mt-1 text-gray-700">
                        {format(new Date(selectedReport.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {selectedReport.status !== 'Resolved' && (
                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Update Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedReport.status === 'Assigned' && (
                            <button
                              onClick={() => handleUpdateStatus(selectedReport._id, 'In Progress')}
                              disabled={updatingStatus}
                              className="btn btn-warning btn-sm"
                            >
                              Start Response
                            </button>
                          )}
                          {(selectedReport.status === 'Assigned' || selectedReport.status === 'In Progress') && (
                            <button
                              onClick={() => handleUpdateStatus(selectedReport._id, 'Resolved')}
                              disabled={updatingStatus}
                              className="btn btn-success btn-sm"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Select a report to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponderDashboard