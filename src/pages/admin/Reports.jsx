import { useState, useEffect } from 'react'
import { mockAPI } from '../../services/api'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import EmergencyMap from '../../components/EmergencyMap'
import Pagination from '../../components/Pagination'
import ImageGallery from '../../components/ImageGallery'
import { FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'

const REPORTS_PER_PAGE = 6

const Reports = () => {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [responders, setResponders] = useState([])
  const [assigningResponder, setAssigningResponder] = useState(false)
  const [selectedResponderId, setSelectedResponderId] = useState('')
  const [showDetails, setShowDetails] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsData, respondersData] = await Promise.all([
          mockAPI.fetchAllReports(),
          mockAPI.getResponders()
        ])
        // Ensure we're working with the reports array from the response
        setReports(reportsData.reports || [])
        setResponders(respondersData)
      } catch (err) {
        setError('Failed to fetch data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAssignResponder = async () => {
    if (!selectedReport || !selectedResponderId) return

    setAssigningResponder(true)
    try {
      const response = await mockAPI.assignResponder(selectedReport._id, selectedResponderId)
      setReports(prevReports => prevReports.map(report =>
        report._id === selectedReport._id ? response.report : report
      ))
      setSelectedReport(response.report)
      setSelectedResponderId('')
      toast.success('Responder assigned successfully')
    } catch (err) {
      toast.error('Failed to assign responder')
      console.error(err)
    } finally {
      setAssigningResponder(false)
    }
  }

  const handleNotifyNearbyUsers = async (reportId, range) => {
    try {
      await mockAPI.notifyNearbyUsers(reportId, range)
      toast.success(`Notifications sent to users within ${range}m`)
    } catch (err) {
      toast.error('Failed to notify nearby users')
      console.error(err)
    }
  }

  const getFilteredResponders = (reportType) => {
    if (!reportType) return []
    return responders.filter(responder =>
      responder.responderType.toLowerCase() === reportType.toLowerCase()
    )
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.type === filter
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  )

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Reports</h1>
        <p className="text-gray-600 mt-1">View and manage all emergency reports</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('all')}
          >
            All Reports
          </button>
          {['Fire', 'Medical', 'Crime', 'Other'].map(type => (
            <button
              key={type}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === type
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center py-4">
              <p>Loading reports...</p>
            </div>
          ) : paginatedReports.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No reports found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {paginatedReports.map(report => (
                  <EmergencyReportCard
                    key={report._id}
                    report={report}
                    actions={
                      <button
                        className="text-sm text-primary-600 hover:text-primary-800"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Details
                      </button>
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

        {/* Map and Selected Report Details */}
        <div>
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Report Locations</h2>
              <EmergencyMap
                reports={filteredReports}
                height="300px"
                onMarkerClick={setSelectedReport}
              />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        {selectedReport.status !== 'Resolved' && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Notify Nearby Users</h4>
                          <div className="space-y-2">
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 500)}
                            >
                              Notify within 500m
                            </button>
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 1000)}
                            >
                              Notify within 1km
                            </button>
                            <button
                              className="btn btn-warning w-full"
                              onClick={() => handleNotifyNearbyUsers(selectedReport._id, 5000)}
                            >
                              Notify within 5km
                            </button>
                          </div>
                        </div>
                        )}
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports