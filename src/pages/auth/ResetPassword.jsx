import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useParams()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await mockAPI.resetPassword(token, formData.newPassword)
      toast.success('Password reset successful')
      navigate('/login', { state: { message: 'Your password has been reset successfully. Please log in with your new password.' } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            className="form-input"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="form-input"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResetPassword