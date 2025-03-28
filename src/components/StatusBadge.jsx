import { REPORT_STATUS } from '../config/constants'

const StatusBadge = ({ status }) => {
  const statusType = REPORT_STATUS.find(s => s.value === status) || { badge: 'badge-pending', label: status }
  
  return (
    <span className={`badge ${statusType.badge}`}>
      {statusType.label}
    </span>
  )
}

export default StatusBadge