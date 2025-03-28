import { format } from 'date-fns'
import { EMERGENCY_TYPES, REPORT_STATUS } from '../config/constants'

const EmergencyReportCard = ({ report, actions, onWithdraw }) => {
  const emergencyType = EMERGENCY_TYPES.find(t => t.value === report.type) || { color: 'emergency-other', label: report.type }
  const statusType = REPORT_STATUS.find(s => s.value === report.status) || { badge: 'badge-pending', label: report.status }
  
  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw this report? This action cannot be undone.')) {
      onWithdraw(report._id);
    }
  };

  const renderMediaPreview = (url) => {
    if (url.includes('.mp4') || url.includes('video')) {
      return (
        <video 
          src={url}
          className="w-full h-32 object-cover rounded-md"
          controls
        />
      )
    } else if (url.includes('.mp3') || url.includes('audio')) {
      return (
        <audio 
          src={url}
          className="w-full mt-2"
          controls
        />
      )
    } else {
      return (
        <img
          src={url}
          alt="Emergency"
          className="w-full h-32 object-cover rounded-md"
        />
      )
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <span className={`badge ${emergencyType.color.replace('emergency-', 'badge-')}`}>
              {emergencyType.label}
            </span>
            <span className={`ml-2 badge ${statusType.badge}`}>
              {statusType.label}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
        
        <h3 className="mt-2 text-lg font-medium text-gray-900 truncate">
          {report.description}
        </h3>
        
        {report.media && report.media.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {report.media.slice(0, 2).map((url, index) => (
              <div key={index} className="w-full">
                {renderMediaPreview(url)}
              </div>
            ))}
            {report.media.length > 2 && (
              <div className="relative col-span-2">
                <span className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
                  +{report.media.length - 2} more
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-2 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>
              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </span>
          </div>
        </div>
        
        {report.assignedResponder && (
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Assigned to: </span>
            <span className="font-medium text-gray-900">{report.assignedResponder.name}</span>
          </div>
        )}
        
        <div className="mt-4 flex space-x-2">
          {onWithdraw && report.status === 'Pending' && (
            <button
              onClick={handleWithdraw}
              className="btn btn-danger btn-sm"
            >
              Withdraw Report
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}

export default EmergencyReportCard