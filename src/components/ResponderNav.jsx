import { Link, useLocation } from 'react-router-dom'

const ResponderNav = () => {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/responder/dashboard' },
    { name: 'All Reports', href: '/responder/reports' }
  ]
  
  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${location.pathname === item.href
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default ResponderNav