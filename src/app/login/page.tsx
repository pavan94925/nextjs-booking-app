'use client'

import { useState } from 'react'
import { loginUser } from '@/actions/authActions' // Assuming this path is correct for the user's project
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  // State variables to manage email, password, and messages
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  // Initialize Next.js router for navigation
  const router = useRouter()

  /**
   * Handles the login form submission.
   * Prevents default form submission, calls the loginUser action,
   * and handles success or failure by setting messages and redirecting.
   * @param {React.FormEvent} e - The form event object.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent default form submission behavior

    // Call the loginUser action with email and password
    const res = await loginUser({ email, password })

    if (res.success) {
      // If login is successful, save user data to localStorage
      localStorage.setItem('user', JSON.stringify(res.user))

      // Set success message and redirect to the dashboard
      setMsg('Login successful!')
      router.push('/dashboard')
    } else {
      // If login fails, set an error message
      setMsg(' ' + res.message)
    }
  }

  return (
    <div className="h-screen flex font-inter">
      {/* Left 50% section */}
      <div className="w-1/2 bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 flex items-center justify-center p-8">
        <div className="text-white text-center space-y-4">
          <img
            // CORRECTED PATH: Reference from the public folder
            src="/images/calender_logo1.jpg"
            alt="Calendly App Logo"
            className="h-39 w-39 mx-auto mb-6 object-contain" // Tailwind classes for sizing, centering, and spacing
          />
          <h1 className="text-6xl font-extrabold leading-tight drop-shadow-lg">
            Calendly App
          </h1>
          <p className="text-xl opacity-90">
            booking slots & scheduling solution.
          </p>
        </div>
      </div>

      {/* Right 50% section with the login form */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 transform transition-all duration-500 hover:scale-105">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 drop-shadow-md tracking-tight">
            Sign In
          </h2>

          <p className="text-center text-gray-600 text-lg">
            Access your account
          </p>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email input field */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out placeholder-gray-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
              />
            </div>

            {/* Password input field */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Login button with a gradient background, shadow, and hover effects */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 shadow-lg"
            >
              Login
            </button>

            {/* "Forgot password" link */}
            <p className="text-sm text-gray-600 text-center">
              Forgot your password?{' '}
              <a
                href="/forgot-password"
                className="text-blue-600 font-medium underline transition duration-200"
              >
                Reset here
              </a>
            </p>

            {/* "Don't have an account" link */}
            <p className="text-sm text-center text-gray-700">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-blue-600 font-medium underline transition duration-200"
              >
                Create Account
              </a>
            </p>

            {/* Message display area (for success or error messages) */}
            {msg && (
              <p
                className={`text-center font-semibold mt-4 ${
                  msg.includes('successful') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {msg}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}