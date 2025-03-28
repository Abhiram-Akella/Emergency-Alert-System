import { useState, useEffect } from 'react'
import { mockAPI } from '../../services/api'
import EmergencyReportCard from '../../components/EmergencyReportCard'
import Pagination from '../../components/Pagination'
import { toast } from 'react-toastify'

const REPORTS_PER_PAGE = 6

const Reports = () => {
  const [reports, setReports] = useState({ resolvedReports: [], unresolvedReports: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await mockAPI.getAssignedReports()
        setReports(data)
      } catch (err) {
        setError('Failed to fetch reports')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchReports()
  }, [])
  
  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const response = await mockAPI.updateReportStatus(reportId, newStatus)
      
      if (newStatus === 'Resolved') {
        setReports({
          unresolvedReports: reports.unresolvedReports.filter(r => r._id !== reportId),
          resolvedReports: [response.report, ...reports.resolvedReports]
        })
      } else {
        setReports({
          ...reports,
          unresolvedReports: reports.unresolvedReports.map(report => 
            report._id === reportId ? response.report : report
          )
        })
      }
      
      toast.success(`Report status updated to ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update report status')
      console.error(err)
    }
  }
  
  const filteredReports = [
    ...(filter === 'resolved' ? [] : reports.unresolvedReports),
    ...(filter === 'active' ? [] : reports.resolvedReports)
  ]

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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">All Reports</h1>
          <p className="text-gray-600 mt-1">View and manage all your assigned reports</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reports List</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'all' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'active' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'resolved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {paginatedReports.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No reports found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedReports.map(report => (
                    <EmergencyReportCard 
                      key={report._id} 
                      report={report}
                      actions={
                        report.status !== 'Resolved' && (
                          <div className="flex flex-wrap gap-2">
                            {report.status === 'Assigned' && (
                              <button
                                onClick={() => handleUpdateStatus(report._id, 'In Progress')}
                                className="btn btn-warning btn-sm"
                              >
                                Start Response
                              </button>
                            )}
                            {(report.status === 'Assigned' || report.status === 'In Progress') && (
                              <button
                                onClick={() => handleUpdateStatus(report._id, 'Resolved')}
                                className="btn btn-success btn-sm"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        )
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
      </div>
    </div>
  )
}

export default Reports