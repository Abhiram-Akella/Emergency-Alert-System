import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { mockAPI } from '../../services/api'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import EmergencyMap from '../../components/EmergencyMap'
import Pagination from '../../components/Pagination'
import { format } from 'date-fns'
import { API_URL } from '../../config/constants'
import { toast } from 'react-toastify'

const REPORTS_PER_PAGE = 6

const UserReports = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  const fetchUserReports = async () => {
    try {
      const data = await mockAPI.getUserReports()
      setReports(data)
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserReports()
  }, [])

  const handleWithdrawReport = async (reportId) => {
    try {
      await mockAPI.withdrawReport(reportId)
      // Remove the report from local state
      setReports(reports.filter(report => report._id !== reportId))
      // Clear selected report if it was withdrawn
      if (selectedReport?._id === reportId) {
        setSelectedReport(null)
      }
      toast.success('Report withdrawn successfully')
    } catch (err) {
      toast.error('Failed to withdraw report')
      console.error(err)
    }
  }
  
  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    if (filter === 'active') return report.status !== 'Resolved'
    if (filter === 'resolved') return report.status === 'Resolved'
    return report.status === filter
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Emergency Reports</h1>
        <p className="text-gray-600">View and track all your emergency reports</p>
      </div>
      
      {/* Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'Pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('Pending')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'Assigned' 
                ? 'bg-indigo-100 text-indigo-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('Assigned')}
          >
            Assigned
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'In Progress' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('In Progress')}
          >
            In Progress
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'resolved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center py-4">
              <p>Loading reports...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : paginatedReports.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">No reports found matching the selected filter</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {paginatedReports.map(report => (
                  <EmergencyReportCard 
                    key={report._id} 
                    report={report}
                    onWithdraw={handleWithdrawReport}
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
        
        {/* Map and Details */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Report Locations</h2>
              <EmergencyMap 
                reports={filteredReports} 
                height="300px"
                onMarkerClick={setSelectedReport}
              />
            </div>
            {selectedReport && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className="ml-2 badge badge-fire">{selectedReport.type}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 badge ${
                      selectedReport.status === 'Pending' ? 'badge-pending' :
                      selectedReport.status === 'Assigned' ? 'badge-assigned' :
                      selectedReport.status === 'In Progress' ? 'badge-in-progress' :
                      'badge-resolved'
                    }`}>
                      {selectedReport.status}
                    </span>
                  </div> 
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="mt-1 text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Reported on:</span>
                    <p className="mt-1 text-sm text-gray-700">
                      {format(new Date(selectedReport.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {selectedReport.assignedResponder && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500">Assigned to:</span>
                      <p className="mt-1 text-sm text-gray-700">
                        {selectedReport.assignedResponder.name}
                      </p>
                    </div>
                  )}
                  {selectedReport.media && selectedReport.media.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500">Media:</span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedReport.media.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Emergency ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedReport.status !== 'Resolved' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleWithdrawReport(selectedReport._id)}
                        className="btn btn-danger w-full"
                      >
                        Withdraw Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserReports