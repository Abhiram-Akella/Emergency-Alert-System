import { Link } from 'react-router-dom'
import { 
  ExclamationTriangleIcon, 
  DocumentTextIcon, 
  PhoneIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline'

export default function QuickActions({ role }) {
  const actions = {
    user: [
      {
        name: 'Report Emergency',
        description: 'Create a new emergency report',
        href: '/user/create-report',
        icon: ExclamationTriangleIcon,
        color: 'text-red-500'
      },
      {
        name: 'My Reports',
        description: 'View your emergency reports',
        href: '/user/reports',
        icon: DocumentTextIcon,
        color: 'text-blue-500'
      },
      {
        name: 'Emergency Contacts',
        description: 'Important contact numbers',
        href: '#',
        icon: PhoneIcon,
        color: 'text-green-500'
      },
      {
        name: 'Safety Guide',
        description: 'Emergency response guidelines',
        href: '#',
        icon: BookOpenIcon,
        color: 'text-purple-500'
      }
    ],
    responder: [
      {
        name: 'Active Reports',
        description: 'View assigned emergencies',
        href: '#active-reports',
        icon: ExclamationTriangleIcon,
        color: 'text-red-500'
      },
      {
        name: 'Response History',
        description: 'Past emergency responses',
        href: '#history',
        icon: DocumentTextIcon,
        color: 'text-blue-500'
      },
      {
        name: 'Team Contact',
        description: 'Contact other responders',
        href: '#team',
        icon: PhoneIcon,
        color: 'text-green-500'
      },
      {
        name: 'Guidelines',
        description: 'Response protocols',
        href: '#guidelines',
        icon: BookOpenIcon,
        color: 'text-purple-500'
      }
    ]
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions[role].map((action) => (
        <Link
          key={action.name}
          to={action.href}
          className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 transition-all duration-200"
        >
          <div className={`flex-shrink-0 ${action.color}`}>
            <action.icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">{action.name}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}