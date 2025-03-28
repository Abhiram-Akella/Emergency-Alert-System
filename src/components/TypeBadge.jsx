import { EMERGENCY_TYPES } from '../config/constants'

const TypeBadge = ({ type }) => {
  const emergencyType = EMERGENCY_TYPES.find(t => t.value === type) || { color: 'emergency-other', label: type }
  
  return (
    <span className={`badge ${emergencyType.color.replace('emergency-', 'badge-')}`}>
      {emergencyType.label}
    </span>
  )
}

export default TypeBadge