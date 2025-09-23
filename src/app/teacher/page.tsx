'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/lib/supabase/types'

type StudentWithProgress = {
  id: string
  full_name: string
  grade: string
  subjects: string[]
  progress: Progress[]
}

export default function TeacherDashboard() {
  const { profile, loading, signOut, canAccessTeacher } = useAuth()
  const [students, setStudents] = useState<StudentWithProgress[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || !canAccessTeacher)) {
      router.push('/login')
    }
  }, [loading, profile, canAccessTeacher, router])

  useEffect(() => {
    if (profile && canAccessTeacher) {
      fetchStudentsAndProgress()
    }
  }, [profile, canAccessTeacher])

  const fetchStudentsAndProgress = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // Get students in same school with matching grade and subjects
      const { data: studentProfiles, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('school_id', profile?.school_id)
        .eq('grade', profile?.grade)

      if (studentsError) throw studentsError

      // Filter students who have overlapping subjects with teacher
      const teacherSubjects = profile?.subjects || []
      const matchingStudents = (studentProfiles || []).filter(student => 
        student.subjects?.some((subject: string) => teacherSubjects.includes(subject))
      )

      // Get progress for these students (RLS will filter to only what teacher can see)
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .in('student_id', matchingStudents.map(s => s.id))
        .order('created_at', { ascending: false })

      if (progressError) throw progressError

      // Combine students with their progress
      const studentsWithProgress = matchingStudents.map(student => ({
        ...student,
        progress: (progressData || []).filter(p => p.student_id === student.id)
      }))

      setStudents(studentsWithProgress)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile && canAccessTeacher) {
      fetchStudentsAndProgress()
    }
  }, [profile, canAccessTeacher, fetchStudentsAndProgress])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile || !canAccessTeacher) {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">
                {profile.full_name} - {profile.grade} {profile.subjects?.join(', ')}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Dashboard
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {loadingData ? (
            <div className="text-center py-8">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found for your grade and subjects.</p>
              <p className="text-sm text-gray-400">
                Students need to signup with matching grade and subjects.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">
                Your Students ({students.length})
              </h2>
              
              {students.map((student) => (
                <div key={student.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{student.full_name}</h3>
                      <p className="text-sm text-gray-600">
                        Grade: {student.grade} | Subjects: {student.subjects?.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/teacher/edit-progress?student=${student.id}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add/Edit Progress
                    </button>
                  </div>
                  
                  {student.progress.length === 0 ? (
                    <p className="text-sm text-gray-500">No progress records yet</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Recent Progress:</p>
                      {student.progress.slice(0, 3).map((progress) => (
                        <div key={progress.id} className="flex justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{progress.subject}</span>
                          <span className="text-sm font-medium">
                            {progress.score}/{progress.max_score} ({Math.round((progress.score / progress.max_score) * 100)}%)
                          </span>
                        </div>
                      ))}
                      {student.progress.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{student.progress.length - 3} more records
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}