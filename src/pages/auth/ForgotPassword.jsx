import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockAPI } from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Pass user object containing email
      await mockAPI.requestPasswordReset({ email })
      setIsSuccess(true)
      toast.success('Password reset link sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
      </div>

      {isSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-600">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
          <p className="text-gray-600 mb-4">
            We've sent a password reset link to your email address.
          </p>
          <Link to="/login" className="text-primary-600 hover:text-primary-500">
            Return to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword