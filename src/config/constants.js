// API URL
export const API_URL = 'http://localhost:3000'

// Mapbox token (replace with your own token in production)
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWJoaXJhbTE3MDkiLCJhIjoiY203eGc4am1sMDVrcjJrc2EwNGRydnd0cyJ9.FSo5HbxG1-6_ekCL6M1LAg'

// Chart Colors
export const CHART_COLORS = {
  // Emergency Types
  fire: {
    solid: '#ef4444',
    transparent: 'rgba(239, 68, 68, 0.5)'
  },
  medical: {
    solid: '#10b981',
    transparent: 'rgba(16, 185, 129, 0.5)'
  },
  crime: {
    solid: '#f59e0b',
    transparent: 'rgba(245, 158, 11, 0.5)'
  },
  other: {
    solid: '#6366f1',
    transparent: 'rgba(99, 102, 241, 0.5)'
  },
  // Status Colors
  pending: {
    solid: '#fbbf24',
    transparent: 'rgba(251, 191, 36, 0.5)'
  },
  assigned: {
    solid: '#60a5fa',
    transparent: 'rgba(96, 165, 250, 0.5)'
  },
  inProgress: {
    solid: '#8b5cf6',
    transparent: 'rgba(139, 92, 246, 0.5)'
  },
  resolved: {
    solid: '#34d399',
    transparent: 'rgba(52, 211, 153, 0.5)'
  }
}

// Emergency types
export const EMERGENCY_TYPES = [
  { value: 'Fire', label: 'Fire', color: 'emergency-fire' },
  { value: 'Medical', label: 'Medical', color: 'emergency-medical' },
  { value: 'Crime', label: 'Crime', color: 'emergency-crime' },
  { value: 'Other', label: 'Other', color: 'emergency-other' }
]

// Report status types
export const REPORT_STATUS = [
  { value: 'Pending', label: 'Pending', badge: 'badge-pending' },
  { value: 'Assigned', label: 'Assigned', badge: 'badge-assigned' },
  { value: 'In Progress', label: 'In Progress', badge: 'badge-in-progress' },
  { value: 'Resolved', label: 'Resolved', badge: 'badge-resolved' }
]

// Responder types
export const RESPONDER_TYPES = [
  { value: 'fire', label: 'Fire Department' },
  { value: 'medical', label: 'Medical Response' },
  { value: 'crime', label: 'Law Enforcement' },
  { value: 'other', label: 'Other' }
]