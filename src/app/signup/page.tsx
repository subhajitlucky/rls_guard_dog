'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase/hooks'
import { UserRole } from '@/lib/supabase/types'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as UserRole,
    schoolName: '',
    grade: '',
    subjects: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🚀 Starting signup with data:', {
        email: formData.email,
        role: formData.role,
        schoolName: formData.schoolName,
        grade: formData.grade,
        subjects: formData.subjects
      })

      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        schoolName: formData.schoolName,
        grade: formData.grade || undefined,
        subjects: formData.subjects.length > 0 ? formData.subjects : undefined
      })
      
      console.log('✅ Signup successful, redirecting...')
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('❌ Signup error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (err && typeof err === 'object') {
        console.error('Error details:', {
          message: 'message' in err ? err.message : 'No message',
          code: 'code' in err ? err.code : 'No code',
          details: 'details' in err ? err.details : 'No details',
          hint: 'hint' in err ? err.hint : 'No hint'
        })
      }
      setError(`Signup failed: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s !== subject)
      }))
    }
  }

  const commonSubjects = ['Math', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join RLS Guard Dog
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="head_teacher">Head Teacher</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                School Name
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your school name"
              />
            </div>

            {(formData.role === 'student' || formData.role === 'teacher') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grade
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select grade</option>
                  <option value="9th">9th Grade</option>
                  <option value="10th">10th Grade</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                </select>
              </div>
            )}

            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects (select what you study)
                </label>
                <div className="space-y-2">
                  {commonSubjects.map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject You Teach
                </label>
                <select
                  value={formData.subjects[0] || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    subjects: e.target.value ? [e.target.value] : [] 
                  }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select subject</option>
                  {commonSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}