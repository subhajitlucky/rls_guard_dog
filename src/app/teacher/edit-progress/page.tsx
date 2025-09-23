'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress, Profile } from '@/lib/supabase/types'

function EditProgressContent() {
  const { profile, loading, canAccessTeacher } = useAuth()
  const [student, setStudent] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [newProgress, setNewProgress] = useState({
    subject: '',
    score: '',
    maxScore: '100'
  })
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student')

  useEffect(() => {
    if (!loading && (!profile || !canAccessTeacher)) {
      router.push('/login')
    }
  }, [loading, profile, canAccessTeacher, router])

  useEffect(() => {
    if (studentId && profile && canAccessTeacher) {
      fetchStudentAndProgress()
    }
  }, [studentId, profile, canAccessTeacher])

  const fetchStudentAndProgress = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // Get student info
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .eq('role', 'student')
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Get progress records (RLS filters to only what teacher can see)
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (progressError) throw progressError
      setProgress(progressData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [studentId, profile])

  useEffect(() => {
    if (studentId && profile && canAccessTeacher) {
      fetchStudentAndProgress()
    }
  }, [studentId, profile, canAccessTeacher, fetchStudentAndProgress])

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student || !newProgress.subject || !newProgress.score) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      // We need a classroom_id - let's create one if it doesn't exist
      let classroomId = null
      
      // Try to find existing classroom
      const { data: existingClassroom } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', profile?.id)
        .eq('subject', newProgress.subject)
        .eq('school_id', profile?.school_id)
        .single()

      if (existingClassroom) {
        classroomId = existingClassroom.id
      } else {
        // Create new classroom
        const { data: newClassroom, error: classroomError } = await supabase
          .from('classrooms')
          .insert({
            name: `${profile?.grade} ${newProgress.subject}`,
            teacher_id: profile?.id,
            subject: newProgress.subject,
            school_id: profile?.school_id
          })
          .select('id')
          .single()

        if (classroomError) throw classroomError
        classroomId = newClassroom.id
      }

      // Add progress record
      const { error: progressError } = await supabase
        .from('progress')
        .insert({
          student_id: student.id,
          classroom_id: classroomId,
          school_id: student.school_id,
          subject: newProgress.subject,
          score: parseInt(newProgress.score),
          max_score: parseInt(newProgress.maxScore)
        })

      if (progressError) throw progressError

      // Reset form and refresh data
      setNewProgress({ subject: '', score: '', maxScore: '100' })
      await fetchStudentAndProgress()
    } catch (error) {
      console.error('Error adding progress:', error)
      alert('Failed to add progress. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProgress = async (progressId: string) => {
    if (!confirm('Are you sure you want to delete this progress record?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('id', progressId)

      if (error) throw error
      await fetchStudentAndProgress()
    } catch (error) {
      console.error('Error deleting progress:', error)
      alert('Failed to delete progress. Please try again.')
    }
  }

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile || !canAccessTeacher || !student) {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>
  }

  const teacherSubjects = profile.subjects || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Progress</h1>
              <p className="text-gray-600">Student: {student.full_name}</p>
            </div>
            <button
              onClick={() => router.push('/teacher')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              ← Back to Students
            </button>
          </div>

          {/* Add New Progress Form */}
          <div className="mb-8 p-4 border rounded-lg bg-blue-50">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Progress</h2>
            <form onSubmit={handleAddProgress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    value={newProgress.subject}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select subject</option>
                    {teacherSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Score</label>
                  <input
                    type="number"
                    min="0"
                    value={newProgress.score}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, score: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="85"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Score</label>
                  <input
                    type="number"
                    min="1"
                    value={newProgress.maxScore}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, maxScore: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Progress'}
              </button>
            </form>
          </div>

          {/* Existing Progress Records */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Existing Progress ({progress.length})
            </h2>
            {progress.length === 0 ? (
              <p className="text-gray-500">No progress records yet.</p>
            ) : (
              <div className="space-y-3">
                {progress.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{record.subject}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {record.score}/{record.max_score}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((record.score / record.max_score) * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProgress(record.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditProgressPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EditProgressContent />
    </Suspense>
  )
}