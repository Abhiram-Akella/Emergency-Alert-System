import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { RESPONDER_TYPES } from '../../config/constants'
import PhoneInput from 'react-phone-input-2'
import Select from 'react-select'
import countryList from 'react-select-country-list'
import 'react-phone-input-2/lib/style.css'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    role: 'user',
    responderType: 'fire',
    adminPassKey: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()
  
  // Get country list for dropdown
  const countries = useMemo(() => countryList().getData(), [])
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCountryChange = (selectedOption) => {
    setFormData({
      ...formData,
      country: selectedOption.label
    })
  }

  const handlePhoneChange = (value) => {
    setFormData({
      ...formData,
      phone: value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await register(formData)
      if (result.success) {
        navigate('/login', { state: { message: 'Registration successful. Please log in.' } })
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="form-input"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        
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
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="country" className="form-label">
            Country
          </label>
          <Select
            id="country"
            name="country"
            options={countries}
            value={countries.find(country => country.label === formData.country)}
            onChange={handleCountryChange}
            className="react-select-container"
            classNamePrefix="react-select"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <PhoneInput
            country={formData.country ? countries.find(c => c.label === formData.country)?.value.toLowerCase() : 'in'}
            value={formData.phone}
            onChange={handlePhoneChange}
            inputClass="!w-full !h-10 !text-base"
            containerClass="!w-full"
            buttonClass="!h-10"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="form-input"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="form-input"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="role" className="form-label">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            className="form-input"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="user">Regular User</option>
            <option value="responder">Emergency Responder</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        {formData.role === 'responder' && (
          <div className="mb-4">
            <label htmlFor="responderType" className="form-label">
              Responder Type
            </label>
            <select
              id="responderType"
              name="responderType"
              className="form-input"
              value={formData.responderType}
              onChange={handleChange}
              required
            >
              {RESPONDER_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {formData.role === 'admin' && (
          <div className="mb-4">
            <label htmlFor="adminPassKey" className="form-label">
              Admin Pass Key
            </label>
            <input
              id="adminPassKey"
              name="adminPassKey"
              type="password"
              className="form-input"
              value={formData.adminPassKey}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
        <div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
        <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default Register