'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AnalyticsDashboard from '../../components/Analytics'

export default function DashboardPage() {
  const { profile, loading, signOut, canAccessTeacher } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return null // Will redirect to login
  }

  const handleGoToTeacher = () => {
    router.push('/teacher')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {profile.full_name}!
              </h1>
              <p className="text-gray-600">
                Role: {profile.role.replace('_', ' ')} | School: {(profile as { schools?: { name?: string } }).schools?.name || 'Unknown'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h2 className="text-lg font-medium text-blue-900 mb-2">
                Your Profile
              </h2>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                {profile.grade && <p><strong>Grade:</strong> {profile.grade}</p>}
                {profile.subjects && profile.subjects.length > 0 && (
                  <p><strong>Subjects:</strong> {profile.subjects.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Analytics Dashboard for Teachers and Head Teachers */}
            {(profile.role === 'teacher' || profile.role === 'head_teacher') && profile.school_id && (
              <AnalyticsDashboard
                schoolId={profile.school_id}
                teacherId={profile.role === 'teacher' ? profile.id : undefined}
                userRole={profile.role}
              />
            )}

            {canAccessTeacher && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Teacher Dashboard
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Access your classroom and manage student progress.
                </p>
                <button
                  onClick={handleGoToTeacher}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Go to Teacher Dashboard
                </button>
              </div>
            )}

            {profile.role === 'student' && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-purple-900 mb-2">
                  Your Progress
                </h3>
                <p className="text-sm text-purple-800 mb-3">
                  View your academic progress and scores.
                </p>
                <button
                  onClick={() => router.push('/student')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                >
                  View My Progress
                </button>
              </div>
            )}

            {profile.role === 'head_teacher' && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-orange-900 mb-2">
                  School Overview
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  Monitor all classes and student progress in your school.
                </p>
                <button
                  onClick={() => router.push('/head-teacher')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Go to School Analytics
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}