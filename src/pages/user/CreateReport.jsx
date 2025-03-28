import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { mockAPI } from '../../services/api'
import { EMERGENCY_TYPES } from '../../config/constants'
import EmergencyMap from '../../components/EmergencyMap'
import { toast } from 'react-toastify'

const CreateReport = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    type: 'Fire',
    description: '',
    latitude: 0,
    longitude: 0
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationLoaded, setLocationLoaded] = useState(false)
  
  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }))
          setLocationLoaded(true)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Location access is required to report emergencies")
        }
      )
    } else {
      setError("Geolocation is not supported by this browser")
    }
  }, [])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      
      if (!isImage && !isVideo && !isAudio) {
        toast.error('Only image, video, and audio files are allowed')
        return false
      }
      
      // Check file size based on type
      if (isImage && file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB limit for images`)
        return false
      }
      if (isVideo && file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 25MB limit for videos`)
        return false
      }
      if (isAudio && file.size > 1024 * 1024) {
        toast.error(`${file.name} exceeds the 1MB limit for audio files`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length + selectedFiles.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, {
          url: reader.result,
          type: file.type
        }])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      // Create FormData object
      const submitFormData = new FormData()
      submitFormData.append('type', formData.type)
      submitFormData.append('description', formData.description)
      submitFormData.append('latitude', formData.latitude)
      submitFormData.append('longitude', formData.longitude)
      
      // Append each file
      selectedFiles.forEach(file => {
        submitFormData.append('media', file)
      })
      
      await mockAPI.createReport(submitFormData)
      navigate('/user/dashboard')
    } catch (err) {
      if (err.response?.data?.error) {
        toast.info(err.response.data.error)
        navigate('/user/dashboard')
      } else {
        setError('Failed to create report')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const renderPreview = (preview, index) => {
    if (preview.type.startsWith('image/')) {
      return (
        <img 
          src={preview.url} 
          alt={`Preview ${index + 1}`} 
          className="h-32 w-full object-cover rounded-md"
        />
      )
    } else if (preview.type.startsWith('video/')) {
      return (
        <video 
          src={preview.url} 
          className="h-32 w-full object-cover rounded-md"
          controls
        />
      )
    } else if (preview.type.startsWith('audio/')) {
      return (
        <audio 
          src={preview.url} 
          className="w-full mt-2"
          controls
        />
      )
    }
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report Emergency</h1>
        <p className="text-gray-600">Provide details about the emergency situation</p>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="type" className="form-label">
                Emergency Type
              </label>
              <select
                id="type"
                name="type"
                className="form-input"
                value={formData.type}
                onChange={handleChange}
                required
              >
                {EMERGENCY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                className="form-input"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the emergency situation in detail"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="media" className="form-label">
                Upload Media (optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="media"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="media"
                        name="media"
                        type="file"
                        accept="image/*,video/*,audio/*"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images (up to 5MB), Videos (up to 25MB), Audio (up to 1MB)
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum 5 files total
                  </p>
                </div>
              </div>
              
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {previewUrls.map((preview, index) => (
                    <div key={index} className="relative">
                      {renderPreview(preview, index)}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="form-label">Location</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="latitude" className="block text-xs text-gray-500">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-xs text-gray-500">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your current location will be used for the emergency report
              </p>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading || !locationLoaded}
              >
                {isLoading ? 'Submitting...' : 'Submit Emergency Report'}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your Location</h2>
            <p className="text-sm text-gray-600 mb-4">
              This map shows your current location that will be used for the emergency report
            </p>
          </div>
          
          {locationLoaded ? (
            <EmergencyMap 
              reports={[{ 
                _id: 'current', 
                type: formData.type, 
                latitude: formData.latitude, 
                longitude: formData.longitude,
                description: 'Your current location',
                status: 'Pending'
              }]} 
              height="400px"
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center h-[400px] flex items-center justify-center">
              <p className="text-gray-600">Loading your location...</p>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
            <p className="mt-1 text-sm text-yellow-700">
              By submitting this report, you confirm that this is a genuine emergency situation. 
              False reports may result in penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateReport