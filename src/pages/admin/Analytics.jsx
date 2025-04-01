import { useState, useEffect } from 'react'
import { mockAPI } from '../../services/api'
import { FiClock, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { useSocket } from '../../contexts/SocketContext'
import { EMERGENCY_TYPES, CHART_COLORS } from '../../config/constants'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeFilter, setTimeFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { socket } = useSocket()

  const fetchAnalytics = async () => {
    try {
      const data = await mockAPI.getAnalytics(timeFilter)
      setAnalyticsData(data)
    } catch (err) {
      setError('Failed to fetch analytics data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeFilter])

  useEffect(() => {
    if (socket) {
      const updateAnalytics = () => {
        fetchAnalytics()
      }

      // Listen for any report status changes
      socket.on('reportUpdated', updateAnalytics)
      socket.on('reportAssigned', updateAnalytics)
      socket.on('reportStatusUpdated', updateAnalytics)
      socket.on('reportAccepted', updateAnalytics)
      socket.on('reportRejected', updateAnalytics)

      return () => {
        socket.off('reportUpdated', updateAnalytics)
        socket.off('reportAssigned', updateAnalytics)
        socket.off('reportStatusUpdated', updateAnalytics)
        socket.off('reportAccepted', updateAnalytics)
        socket.off('reportRejected', updateAnalytics)
      }
    }
  }, [socket, timeFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  // Ensure all emergency types are represented in the data
  const allEmergencyTypes = EMERGENCY_TYPES.map(type => type.value)
  const typeDistribution = allEmergencyTypes.map(type => {
    const found = analyticsData.typeDistribution.find(item => item._id === type)
    return found || { _id: type, count: 0 }
  })

  // Get consistent colors for emergency types
  const emergencyTypeColors = {
    Fire: CHART_COLORS.fire,
    Medical: CHART_COLORS.medical,
    Crime: CHART_COLORS.crime,
    Other: CHART_COLORS.other
  }

  // Get consistent colors for status types
  const statusColors = {
    Pending: CHART_COLORS.pending,
    Assigned: CHART_COLORS.assigned,
    'In Progress': CHART_COLORS.inProgress,
    Resolved: CHART_COLORS.resolved
  }

  // Prepare chart data with consistent colors
  const typeChartData = {
    labels: typeDistribution.map(item => `${item._id} (${Math.round((item.count / analyticsData.totalReports) * 100 || 0)}%)`),
    datasets: [{
      data: typeDistribution.map(item => item.count),
      backgroundColor: typeDistribution.map(item => emergencyTypeColors[item._id].solid)
    }]
  }

  const statusChartData = {
    labels: analyticsData.statusDistribution.map(item => `${item._id} (${Math.round((item.count / analyticsData.totalReports) * 100)}%)`),
    datasets: [{
      data: analyticsData.statusDistribution.map(item => item.count),
      backgroundColor: analyticsData.statusDistribution.map(item => statusColors[item._id].solid)
    }]
  }

  // Ensure all types are represented in response times
  const responseTimeChartData = {
    labels: allEmergencyTypes,
    datasets: [{
      label: 'Average Response Time (minutes)',
      data: allEmergencyTypes.map(type => {
        const found = analyticsData.responseTimesByType.find(item => item._id === type)
        return found ? Math.round(found.avgResponseTime) : 0
      }),
      backgroundColor: allEmergencyTypes.map(type => emergencyTypeColors[type].transparent),
      borderColor: allEmergencyTypes.map(type => emergencyTypeColors[type].solid),
      borderWidth: 1
    }]
  }

  // Ensure all types are represented in resolution times
  const resolutionTimeChartData = {
    labels: allEmergencyTypes,
    datasets: [{
      label: 'Average Resolution Time (minutes)',
      data: allEmergencyTypes.map(type => {
        const found = analyticsData.resolutionTimesByType.find(item => item._id === type)
        return found ? Math.round(found.avgResolutionTime) : 0
      }),
      backgroundColor: allEmergencyTypes.map(type => emergencyTypeColors[type].transparent),
      borderColor: allEmergencyTypes.map(type => emergencyTypeColors[type].solid),
      borderWidth: 1
    }]
  }

  // Calculate overall average response time including all types
  const overallAvgResponseTime = Math.round(
    allEmergencyTypes.reduce((sum, type) => {
      const found = analyticsData.responseTimesByType.find(item => item._id === type)
      return sum + (found ? found.avgResponseTime : 0)
    }, 0) / allEmergencyTypes.length
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive analysis of emergency reports and response metrics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Time Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeFilter === 'weekly'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTimeFilter('weekly')}
          >
            Last 7 Days
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeFilter === 'monthly'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTimeFilter('monthly')}
          >
            Last 30 Days
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeFilter === 'yearly'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTimeFilter('yearly')}
          >
            Last Year
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeFilter === ''
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTimeFilter('')}
          >
            Overall
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3 text-primary-600">
              <FiTrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3 text-yellow-600">
              <FiAlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.activeReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3 text-green-600">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.resolvedReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3 text-blue-600">
              <FiClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overallAvgResponseTime}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Types Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Types Distribution</h2>
          <div className="aspect-square">
            <Pie data={typeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Status Distribution</h2>
          <div className="aspect-square">
            <Pie data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Response Time by Type */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Response Time by Emergency Type</h2>
          <Bar 
            data={responseTimeChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false
                }
              }
            }} 
          />
        </div>

        {/* Resolution Time by Type */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Resolution Time by Emergency Type</h2>
          <Bar 
            data={resolutionTimeChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emergency Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Reports
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Response Time
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Resolution Time
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {typeDistribution.map((type) => {
                  const responseTime = analyticsData.responseTimesByType.find(t => t._id === type._id)?.avgResponseTime || 0
                  const resolutionTime = analyticsData.resolutionTimesByType.find(t => t._id === type._id)?.avgResolutionTime || 0
                  const resolvedCount = analyticsData.reports.filter(r => r.type === type._id && r.status === 'Resolved').length
                  const resolutionRate = type.count > 0 ? Math.round((resolvedCount / type.count) * 100) : 0
                  
                  return (
                    <tr key={type._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {type._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(responseTime)} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(resolutionTime)} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resolutionRate}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics