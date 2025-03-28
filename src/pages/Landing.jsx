import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { mockAPI } from '../services/api'
import { toast } from 'react-toastify'
import { FiAlertTriangle, FiShield, FiClock, FiUsers, FiMic, FiStopCircle, FiX } from 'react-icons/fi'
import { useReactMediaRecorder } from 'react-media-recorder'

const Landing = () => {
  const [sendingDistress, setSendingDistress] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    echoCancellation: true,
    noiseSuppression: true
  })

  // Get user's location when page loads
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error("Please enable location services to use emergency features")
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser")
    }
  }, [])

  const features = [
    {
      icon: <FiAlertTriangle className="h-6 w-6" />,
      title: "Instant Emergency Reporting",
      description: "Report emergencies in real-time with location tracking and media upload capabilities."
    },
    {
      icon: <FiShield className="h-6 w-6" />,
      title: "24/7 Response Team",
      description: "Dedicated emergency responders available round the clock to handle critical situations."
    },
    {
      icon: <FiClock className="h-6 w-6" />,
      title: "Real-time Updates",
      description: "Get live updates on your emergency reports and responder status."
    },
    {
      icon: <FiUsers className="h-6 w-6" />,
      title: "Community Alerts",
      description: "Receive notifications about emergencies in your vicinity to stay informed and safe."
    }
  ]

  const handleDistressSignal = async (audioBlob) => {
    if (!userLocation) {
      toast.error("Location services are required to send a distress signal")
      return
    }

    setSendingDistress(true)

    try {
      const data = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }
      
      await mockAPI.createDistressReport(data, audioBlob)
      toast.success("Distress signal sent successfully. Help is on the way!")
      
      // Clear recording if exists
      if (audioBlob) {
        clearBlobUrl()
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error sending distress signal:', error)
      toast.error(error.message || "Failed to send distress signal")
    } finally {
      setSendingDistress(false)
    }
  }

  const handleRecordingComplete = async () => {
    if (mediaBlobUrl) {
      try {
        const response = await fetch(mediaBlobUrl)
        const audioBlob = await response.blob()
        await handleDistressSignal(audioBlob)
      } catch (error) {
        console.error('Error processing audio:', error)
        toast.error('Failed to process audio recording')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary-600">Emergency Alert</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="btn btn-outline text-primary-600 hover:bg-primary-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-90" />
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Emergency Response System
            </h1>
            <p className="mt-6 text-xl text-gray-100 max-w-3xl mx-auto">
              Your safety is our priority. Report emergencies instantly and get immediate assistance from our dedicated response team.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 items-center">
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-50"
              >
                Get Started
              </Link>
              
              <button
                onClick={() => setShowModal(true)}
                disabled={sendingDistress || !userLocation}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
              >
                {sendingDistress ? (
                  "Sending..."
                ) : (
                  <>
                    <FiAlertTriangle className="h-5 w-5" />
                    Send Distress Signal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Distress Signal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Distress Signal</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  clearBlobUrl()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Record an audio message to describe your emergency situation. This will help responders better understand and respond to your needs.
              </p>

              <div className="flex flex-col items-center gap-4 p-4 border border-gray-200 rounded-lg">
                {status === 'recording' ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <FiStopCircle className="h-6 w-6" />
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <FiMic className="h-6 w-6" />
                    Start Recording
                  </button>
                )}

                {mediaBlobUrl && (
                  <audio src={mediaBlobUrl} controls className="w-full" />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowModal(false)
                    clearBlobUrl()
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={mediaBlobUrl ? handleRecordingComplete : () => handleDistressSignal()}
                  disabled={sendingDistress}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  {sendingDistress ? "Sending..." : "Send Distress Signal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose Our Platform?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A comprehensive emergency response system designed for your safety
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                    {feature.icon}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-200">Join our platform today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-4">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-50"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="btn bg-primary-100 text-primary-600 hover:bg-primary-200"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing