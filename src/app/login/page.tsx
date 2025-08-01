'use client'

import { useState } from 'react'
import { loginUser } from '@/actions/authActions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  type Errors = {
    email?: string
    password?: string
  }
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

 
  const isValidEmail = (email: string) => {
    // Simple email validation 
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const validateForm = () => {
    const newErrors: Errors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e:any) => {
    e.preventDefault()
    setMessage('')
    setErrors({}) 
  
    if (!validateForm()) {
      setMessage('Please fix the errors below')
      return
    }

    setIsLoading(true)

    try {
      const result = await loginUser({ email, password })

      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user))
        setMessage('Login successful!')
        router.push('/dashboard')
      } else {
        setMessage(result.message || 'Login failed. Please try again.')
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e:any) => {
    setEmail(e.target.value.toLowerCase())
    if (errors.email) {
      setErrors({ ...errors, email: '' })
    }
  }

  const handlePasswordChange = (e:any) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors({ ...errors, password: '' })
    }
  }

  return (
    <div className="h-screen flex">
      <div className="w-1/2 bg-gradient-to-br from-purple-700 to-blue-700 flex items-center justify-center">
        <div className="text-white text-center">
          <img
            src="/images/calender_logo1.jpg"
            alt="Calendly App Logo"
            className="h-39 w-39 mx-auto mb-6"
          />
          <h1 className="text-6xl font-bold">Calendly App</h1>
          <p className="text-xl mt-4">booking slots & scheduling.</p>
        </div>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Sign In
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateForm()} 
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-400 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validateForm()} 
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white font-bold py-3 rounded-lg ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-sm text-center text-gray-600">
              Forgot your password?{' '}
              <a href="/forgot-password" className="text-blue-600 underline hover:text-blue-800">
                Reset here
              </a>
            </p>

            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 underline hover:text-blue-800">
                Create Account
              </a>
            </p>
            {message && (
              <p className={`text-center font-semibold ${
                message.includes('successful') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}