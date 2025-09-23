'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/lib/supabase/types'

export default function StudentDashboard() {
  const { profile, loading, signOut } = useAuth()
  const [progress, setProgress] = useState<Progress[]>([])
  const [loadingProgress, setLoadingProgress] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  useEffect(() => {
    if (profile && profile.role === 'student') {
      fetchProgress()
    }
  }, [profile])

  const fetchProgress = async () => {
    try {
      const supabase = createClient()
      // RLS automatically filters to only this student's records
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProgress(data || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoadingProgress(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile || profile.role !== 'student') {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
              <p className="text-gray-600">{profile.full_name} - {profile.grade}</p>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>

          {loadingProgress ? (
            <div className="text-center py-8">Loading your progress...</div>
          ) : progress.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No progress records yet.</p>
              <p className="text-sm text-gray-400">Your teachers will add them soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Your Scores</h2>
              {progress.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{record.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {record.score}/{record.max_score}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round((record.score / record.max_score) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}