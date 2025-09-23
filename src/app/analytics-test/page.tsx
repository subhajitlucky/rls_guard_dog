'use client'

import { useEffect, useState } from 'react'

interface ClassAverage {
  _id: string
  classroom_id: string
  classroom_name: string
  school_id: string
  school_name: string
  teacher_id: string
  teacher_name: string
  subject: string
  average_score: number
  total_students: number
  last_updated: string
  scores_distribution: {
    excellent: number
    good: number
    satisfactory: number
    needs_improvement: number
  }
}

interface SchoolAnalytics {
  _id: string
  school_id: string
  school_name: string
  total_students: number
  total_teachers: number
  total_classrooms: number
  overall_average: number
  subject_averages: Array<{
    subject: string
    average: number
    student_count: number
  }>
  last_updated: string
}

export default function AnalyticsTestPage() {
  const [classAverages, setClassAverages] = useState<ClassAverage[]>([])
  const [schoolAnalytics, setSchoolAnalytics] = useState<SchoolAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch class averages
      const classResponse = await fetch('/api/analytics?type=class_averages')
      const classData = await classResponse.json()
      
      if (!classData.success) {
        throw new Error(classData.error || 'Failed to fetch class averages')
      }

      // Fetch school analytics
      const schoolResponse = await fetch('/api/analytics?type=school_analytics')
      const schoolData = await schoolResponse.json()
      
      if (!schoolData.success) {
        throw new Error(schoolData.error || 'Failed to fetch school analytics')
      }

      setClassAverages(classData.data || [])
      setSchoolAnalytics(schoolData.data || [])

    } catch (err) {
      console.error('Error loading analytics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadAnalytics}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time analytics from MongoDB</p>
          <button 
            onClick={loadAnalytics}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>

        {/* School Analytics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">School Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schoolAnalytics.map((school) => (
              <div key={school._id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{school.school_name}</h3>
                
                <div className="mb-4">
                  <div className={`text-3xl font-bold ${getScoreColor(school.overall_average)} mb-2`}>
                    {school.overall_average}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Average</div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-semibold text-blue-600">{school.total_students}</div>
                    <div className="text-gray-600">Students</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">{school.total_teachers}</div>
                    <div className="text-gray-600">Teachers</div>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-600">{school.total_classrooms}</div>
                    <div className="text-gray-600">Classes</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subject Averages</h4>
                  <div className="space-y-2">
                    {school.subject_averages.map((subject, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{subject.subject}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(subject.average)}`}>
                          {subject.average}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Averages */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Class Performance</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classAverages.map((classAvg) => (
                    <tr key={classAvg._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {classAvg.classroom_name}
                          </div>
                          <div className="text-sm text-gray-500">{classAvg.subject}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classAvg.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classAvg.school_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${getScoreColor(classAvg.average_score)}`}>
                          {classAvg.average_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classAvg.total_students}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {classAvg.scores_distribution.excellent > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              {classAvg.scores_distribution.excellent} A+
                            </span>
                          )}
                          {classAvg.scores_distribution.good > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {classAvg.scores_distribution.good} B
                            </span>
                          )}
                          {classAvg.scores_distribution.satisfactory > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {classAvg.scores_distribution.satisfactory} C
                            </span>
                          )}
                          {classAvg.scores_distribution.needs_improvement > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              {classAvg.scores_distribution.needs_improvement} D
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Analytics updated from live MongoDB data</p>
          <p className="mt-1">
            Last updated: {classAverages[0]?.last_updated ? 
              new Date(classAverages[0].last_updated).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>
    </div>
  )
}