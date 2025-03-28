import { useState, useEffect } from 'react'
import { mockAPI } from '../../services/api'
import { FiExternalLink, FiPhone, FiBookOpen, FiShield, FiHeart, FiAlertTriangle } from 'react-icons/fi'

const SafetyResources = () => {
  const [resources, setResources] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await mockAPI.getSafetyResources();
        
        setResources(data)
      } catch (err) {
        setError('Failed to fetch safety resources')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResources()
  }, [])

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Emergency Contacts':
        return <FiPhone className="h-6 w-6" />
      case 'First Aid & Medical Guides':
        return <FiHeart className="h-6 w-6" />
      case 'Disaster Preparedness':
        return <FiAlertTriangle className="h-6 w-6" />
      case 'Crime Prevention & Personal Safety':
        return <FiShield className="h-6 w-6" />
      default:
        return <FiBookOpen className="h-6 w-6" />
    }
  }

  const filteredResources = activeCategory === 'all' 
    ? resources 
    : resources.filter(resource => resource.category === activeCategory)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading safety resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Safety Resources</h1>
        <p className="text-gray-600 mt-1">Access important safety information and emergency guidelines</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setActiveCategory('all')}
          >
            All Resources
          </button>
          {resources.map(resource => (
            <button
              key={resource.category}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === resource.category
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setActiveCategory(resource.category)}
            >
              {resource.category}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredResources.map((resource) => (
          <div key={resource.category} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  {getCategoryIcon(resource.category)}
                </div>
                <h2 className="ml-4 text-lg font-semibold text-gray-900">{resource.category}</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {resource.items.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex-shrink-0 text-primary-600 hover:text-primary-700"
                    >
                      <FiExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SafetyResources