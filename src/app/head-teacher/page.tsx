'use client'

import { useAuth } from '@/lib/supabase/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/lib/supabase/types'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClassrooms: number
  totalProgress: number
  subjectStats: { [subject: string]: { count: number; avgScore: number } }
  gradeStats: { [grade: string]: { count: number; avgScore: number } }
}

export default function HeadTeacherPage() {
  const { profile, loading, isHeadTeacher } = useAuth()
  const [stats, setStats] = useState<SchoolStats | null>(null)
  const [recentProgress, setRecentProgress] = useState<(Progress & { student_name: string; teacher_name: string })[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || !isHeadTeacher)) {
      router.push('/login')
    }
  }, [loading, profile, isHeadTeacher, router])

  useEffect(() => {
    if (profile && isHeadTeacher) {
      fetchSchoolData()
    }
  }, [profile, isHeadTeacher])

  const fetchSchoolData = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // Get all students in school
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', profile?.school_id)
        .eq('role', 'student')

      if (studentsError) throw studentsError

      // Get all teachers in school
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', profile?.school_id)
        .eq('role', 'teacher')

      if (teachersError) throw teachersError

      // Get all classrooms in school
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('school_id', profile?.school_id)

      if (classroomsError) throw classroomsError

      // Get all progress in school with student and teacher names
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          *,
          student:profiles!progress_student_id_fkey(full_name),
          classroom:classrooms!progress_classroom_id_fkey(
            teacher:profiles!classrooms_teacher_id_fkey(full_name)
          )
        `)
        .eq('school_id', profile?.school_id)
        .order('created_at', { ascending: false })

      if (progressError) throw progressError

      // Calculate stats
      const subjectStats: { [subject: string]: { count: number; totalScore: number; totalMaxScore: number } } = {}
      const gradeStats: { [grade: string]: { count: number; totalScore: number; totalMaxScore: number } } = {}

      // Process progress data
      const recentProgressWithNames = (progressData || []).map(p => ({
        ...p,
        student_name: p.student?.full_name || 'Unknown',
        teacher_name: p.classroom?.teacher?.full_name || 'Unknown'
      }))

      progressData?.forEach(p => {
        // Subject stats
        if (!subjectStats[p.subject]) {
          subjectStats[p.subject] = { count: 0, totalScore: 0, totalMaxScore: 0 }
        }
        subjectStats[p.subject].count++
        subjectStats[p.subject].totalScore += p.score
        subjectStats[p.subject].totalMaxScore += p.max_score

        // Find student grade for grade stats
        const student = students?.find(s => s.id === p.student_id)
        if (student?.grade) {
          if (!gradeStats[student.grade]) {
            gradeStats[student.grade] = { count: 0, totalScore: 0, totalMaxScore: 0 }
          }
          gradeStats[student.grade].count++
          gradeStats[student.grade].totalScore += p.score
          gradeStats[student.grade].totalMaxScore += p.max_score
        }
      })

      // Convert to final stats with averages
      const finalSubjectStats: { [subject: string]: { count: number; avgScore: number } } = {}
      Object.entries(subjectStats).forEach(([subject, data]) => {
        finalSubjectStats[subject] = {
          count: data.count,
          avgScore: data.totalMaxScore > 0 ? Math.round((data.totalScore / data.totalMaxScore) * 100) : 0
        }
      })

      const finalGradeStats: { [grade: string]: { count: number; avgScore: number } } = {}
      Object.entries(gradeStats).forEach(([grade, data]) => {
        finalGradeStats[grade] = {
          count: data.count,
          avgScore: data.totalMaxScore > 0 ? Math.round((data.totalScore / data.totalMaxScore) * 100) : 0
        }
      })

      setStats({
        totalStudents: students?.length || 0,
        totalTeachers: teachers?.length || 0,
        totalClassrooms: classrooms?.length || 0,
        totalProgress: progressData?.length || 0,
        subjectStats: finalSubjectStats,
        gradeStats: finalGradeStats
      })

      setRecentProgress(recentProgressWithNames.slice(0, 10)) // Show last 10

    } catch (error) {
      console.error('Error fetching school data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile && isHeadTeacher) {
      fetchSchoolData()
    }
  }, [profile, isHeadTeacher, fetchSchoolData])

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!profile || !isHeadTeacher) {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Head Teacher Dashboard</h1>
              <p className="text-gray-600">School-wide overview and analytics</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => router.push('/analytics')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
              >
                📊 MongoDB Analytics
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats?.totalTeachers}</div>
            <div className="text-sm text-gray-600">Total Teachers</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats?.totalClassrooms}</div>
            <div className="text-sm text-gray-600">Total Classrooms</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{stats?.totalProgress}</div>
            <div className="text-sm text-gray-600">Progress Records</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Subject</h2>
            {Object.keys(stats?.subjectStats || {}).length === 0 ? (
              <p className="text-gray-500">No progress data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.subjectStats || {}).map(([subject, data]) => (
                  <div key={subject} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{subject}</div>
                      <div className="text-sm text-gray-500">{data.count} records</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{data.avgScore}%</div>
                      <div className="text-sm text-gray-500">Average</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grade Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Grade</h2>
            {Object.keys(stats?.gradeStats || {}).length === 0 ? (
              <p className="text-gray-500">No progress data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.gradeStats || {}).map(([grade, data]) => (
                  <div key={grade} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Grade {grade}</div>
                      <div className="text-sm text-gray-500">{data.count} records</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{data.avgScore}%</div>
                      <div className="text-sm text-gray-500">Average</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Progress Updates</h2>
          {recentProgress.length === 0 ? (
            <p className="text-gray-500">No recent progress updates</p>
          ) : (
            <div className="space-y-3">
              {recentProgress.map((record) => (
                <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{record.student_name}</div>
                    <div className="text-sm text-gray-600">
                      {record.subject} • by {record.teacher_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {record.score}/{record.max_score}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round((record.score / record.max_score) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}