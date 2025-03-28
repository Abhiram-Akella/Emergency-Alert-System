import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { mockAPI } from '../../services/api'
import EmergencyMap from '../../components/EmergencyMap'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import StatCard from '../../components/StatCard'
import ImageGallery from '../../components/ImageGallery'
import { FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiUsers, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'

const REPORTS_PER_PAGE = 4

const AdminDashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [reports, setReports] = useState([])
  const [responders, setResponders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [assigningResponder, setAssigningResponder] = useState(false)
  const [selectedResponderId, setSelectedResponderId] = useState('')
  const [notifyingUsers, setNotifyingUsers] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetails, setShowDetails] = useState(true)
  
  // Stats calculations
  const [stats, setStats] = useState({
    pendingReports: 0,
    assignedReports: 0,
    inProgressReports: 0,
    totalReports: 0
  })
  
  const updateStats = useCallback((currentReports) => {
    if (!Array.isArray(currentReports)) return;
    
    setStats({
      pendingReports: currentReports.filter(report => report.status === 'Pending').length,
      assignedReports: currentReports.filter(report => report.status === 'Assigned').length,
      inProgressReports: currentReports.filter(report => report.status === 'In Progress').length,
      totalReports: currentReports.length
    })
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [reportsData, respondersData] = await Promise.all([
        mockAPI.fetchReports(),
        mockAPI.getResponders()
      ])
      
      // Ensure we're working with the reports array from the response
      const reportsArray = reportsData.reports || [];
      setReports(reportsArray)
      setResponders(respondersData)
      updateStats(reportsArray)
      
      // Update selected report if it exists in the new data
      if (selectedReport) {
        const updatedReport = reportsArray.find(r => r._id === selectedReport._id)
        setSelectedReport(updatedReport || null)
      }
    } catch (err) {
      setError('Failed to fetch data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedReport, updateStats])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        fetchData()
      }
      const handleReportWithdrawn = ()=>{
        toast.info(`Report has been withdrawn`);
        fetchData();
      }

      // Listen for all relevant events
      socket.on('newEmergency', handleUpdate)
      socket.on('reportUpdated', handleUpdate)
      socket.on('reportAssigned', handleUpdate)
      socket.on('reportStatusUpdated', handleUpdate)
      socket.on('reportAccepted', handleUpdate)
      socket.on('reportRejected', handleUpdate)
      socket.on('reportWithdrawn', handleReportWithdrawn)

      return () => {
        socket.off('newEmergency', handleUpdate)
        socket.off('reportUpdated', handleUpdate)
        socket.off('reportAssigned', handleUpdate)
        socket.off('reportStatusUpdated', handleUpdate)
        socket.off('reportAccepted', handleUpdate)
        socket.off('reportRejected', handleUpdate)
        socket.off('reportWithdrawn', handleReportWithdrawn)
      }
    }
  }, [socket, fetchData])

  const handleAssignResponder = async () => {
    if (!selectedReport || !selectedResponderId) return
    
    setAssigningResponder(true)
    
    try {
      const response = await mockAPI.assignResponder(selectedReport._id, selectedResponderId)
      await fetchData() // Refresh all data after assignment
      setSelectedReport(response.report)
      setSelectedResponderId('')
    } catch (err) {
      setError('Failed to assign responder')
      toast.error('Failed to assign responder', {
        toastId: `assign-error-${selectedReport._id}`
      })
      console.error(err)
    } finally {
      setAssigningResponder(false)
    }
  }

  const handleNotifyNearbyUsers = async (reportId, range) => {
    setNotifyingUsers(true)
    try {
      await mockAPI.notifyNearbyUsers(reportId, range)
      toast.success(`Notifications sent to users within ${range}m`, {
        toastId: `notify-${reportId}-${range}`
      })
    } catch (err) {
      toast.error('Failed to notify nearby users', {
        toastId: `notify-error-${reportId}`
      })
      console.error(err)
    } finally {
      setNotifyingUsers(false)
    }
  }

  const getFilteredResponders = (reportType) => {
    if (!reportType) return []
    
    if (reportType.toLowerCase() === 'other') {
      return responders
    }
    
    return responders.filter(responder => 
      responder.responderType.toLowerCase() === reportType.toLowerCase()
    )
  }

  
  // Get active reports (non-resolved)
  const activeReports = Array.isArray(reports) ? reports.filter(report => report.status !== 'Resolved') : []

  // Pagination calculations
  const totalPages = Math.ceil(activeReports.length / REPORTS_PER_PAGE)
  const paginatedReports = activeReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  )
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Admin!</h1>
        <p className="text-gray-600 mt-1">Monitor emergencies and take actions</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Active Reports" 
          value={stats.totalReports} 
          icon={<FiMapPin className="h-5 w-5" />} 
          color="primary"
        />
        <StatCard 
          title="Pending" 
          value={stats.pendingReports} 
          icon={<FiClock className="h-5 w-5" />} 
          color="warning"
        />
        <StatCard 
          title="Assigned" 
          value={stats.assignedReports} 
          icon={<FiAlertCircle className="h-5 w-5" />} 
          color="info"
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgressReports} 
          icon={<FiCheckCircle className="h-5 w-5" />} 
          color="secondary"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map and Reports */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Emergency Reports Map</h2>
            <EmergencyMap 
                reports={activeReports}
                height="400px" 
                onMarkerClick={setSelectedReport}
              />
          </div>
          
          {/* Reports List */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Active Emergency Reports</h2>
            
            {isLoading ? (
              <div className="text-center py-4">
                <p>Loading reports...</p>
              </div>
            ) : activeReports.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">No active emergency reports</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedReports.map(report => (
                    <EmergencyReportCard 
                      key={report._id} 
                      report={report}
                      actions={
                        <div className="flex space-x-2">
                          <button 
                            className="text-sm text-primary-600 hover:text-primary-800"
                            onClick={() => setSelectedReport(report)}
                          >
                            View Details
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Selected Report Details */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showDetails ? (
                    <FiX className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">Show</span>
                  )}
                </button>
              </div>
              
              {showDetails && (
                <div className="p-4">
                  {selectedReport ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedReport.type} Emergency
                        </h3>
                        <span className={`badge ${
                          selectedReport.status === 'Pending' ? 'badge-pending' :
                          selectedReport.status === 'Assigned' ? 'badge-assigned' :
                          selectedReport.status === 'In Progress' ? 'badge-in-progress' :
                          'badge-resolved'
                        }`}>
                          {selectedReport.status}
                        </span>
                      </div>
                      
                      <div className="mt-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500">Description</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedReport.description}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedReport.user?.name || "Unknown User"}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500">Location</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                          </p>
                        </div>

                        {selectedReport.media && selectedReport.media.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Images</h4>
                            <ImageGallery images={selectedReport.media} />
                          </div>
                        )}
                        
                        {selectedReport.status === 'Pending' && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500">Assign Responder</h4>
                            <div className="mt-2">
                              <select
                                className="form-input mb-2"
                                value={selectedResponderId}
                                onChange={(e) => setSelectedResponderId(e.target.value)}
                              >
                                <option value="">Select a responder</option>
                                {getFilteredResponders(selectedReport.type).map(responder => (
                                  <option key={responder._id} value={responder._id}>
                                    {responder.name} - {responder.responderType}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn btn-primary w-full"
                                disabled={!selectedResponderId || assigningResponder}
                                onClick={handleAssignResponder}
                              >
                                {assigningResponder ? 'Assigning...' : 'Assign Responder'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {selectedReport.assignedResponder && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-500">Assigned Responder</h4>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedReport.assignedResponder.name}
                            </p>
                          </div>
                        )}
                        
                        {/* Notify Nearby Users */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Notify Nearby Users</h4>
                          <div className="space-y-2">
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 500)}
                              disabled={notifyingUsers}
                            >
                              Notify within 500m
                            </button>
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 1000)}
                              disabled={notifyingUsers}
                            >
                              Notify within 1km
                            </button>
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 5000)}
                              disabled={notifyingUsers}
                            >
                              Notify within 5km
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Select a report to view details</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Responders List */}
            <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Available Responders</h3>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <p className="text-center text-gray-500">Loading responders...</p>
                ) : responders.length === 0 ? (
                  <p className="text-center text-gray-500">No responders available</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {responders.map(responder => (
                      <div key={responder._id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                        <div className="h-8 w-8 rounded-full bg-secondary-600 flex items-center justify-center text-white">
                          <FiUsers className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{responder.name}</p>
                          <p className="text-xs text-gray-500">Type: {responder.responderType}</p>
                        </div>
                      </div>
                    ))}
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

export default AdminDashboard