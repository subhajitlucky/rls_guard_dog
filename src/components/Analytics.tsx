'use client'

import React from 'react'
import { useAnalytics, ClassAverage, SchoolAnalytics } from '@/hooks/useAnalytics'

interface AnalyticsDashboardProps {
  schoolId: string
  teacherId?: string
  userRole: 'teacher' | 'head_teacher'
}

export default function AnalyticsDashboard({
  schoolId,
  teacherId,
  userRole
}: AnalyticsDashboardProps) {
  const { data, loading, error, refetch } = useAnalytics({
    type: userRole === 'head_teacher' ? 'school_analytics' : 'class_averages',
    school_id: schoolId,
    teacher_id: teacherId,
    refreshInterval: 300000 // Refresh every 5 minutes
  })

  const formatPercentage = (score: number) => {
    return `${Math.round(score)}%`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {userRole === 'head_teacher' ? 'School Analytics' : 'Class Analytics'}
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {userRole === 'head_teacher' ? 'School Analytics' : 'Class Analytics'}
          </h3>
          <button
            onClick={refetch}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Retry
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (userRole === 'head_teacher') {
    const schoolData = data as SchoolAnalytics[]
    const school = schoolData[0]

    if (!school) {
      return (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">School Analytics</h3>
          <p className="text-gray-500 text-center py-8">No analytics data available</p>
        </div>
      )
    }

    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">School Analytics</h3>
          <button
            onClick={refetch}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>

        {/* School Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{school.total_students}</div>
            <div className="text-sm text-blue-600">Total Students</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{school.total_teachers}</div>
            <div className="text-sm text-green-600">Total Teachers</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{school.total_classrooms}</div>
            <div className="text-sm text-purple-600">Total Classrooms</div>
          </div>
          <div className={`p-4 rounded-lg ${getScoreBgColor(school.overall_average)}`}>
            <div className={`text-2xl font-bold ${getScoreColor(school.overall_average)}`}>
              {formatPercentage(school.overall_average)}
            </div>
            <div className={`text-sm ${getScoreColor(school.overall_average)}`}>Overall Average</div>
          </div>
        </div>

        {/* Subject Averages */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Subject Performance</h4>
          <div className="space-y-2">
            {school.subject_averages.map((subject, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{subject.subject}</span>
                  <span className="text-sm text-gray-500 ml-2">({subject.student_count} students)</span>
                </div>
                <span className={`font-medium ${getScoreColor(subject.average)}`}>
                  {formatPercentage(subject.average)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Averages */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Grade Performance</h4>
          <div className="space-y-2">
            {school.grade_averages?.map((grade, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Grade {grade.grade}</span>
                  <span className="text-sm text-gray-500 ml-2">({grade.student_count} students)</span>
                </div>
                <span className={`font-medium ${getScoreColor(grade.average)}`}>
                  {formatPercentage(grade.average)}
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No grade data available</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Teacher view - class averages
  const classData = data as ClassAverage[]

  if (classData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Class Analytics</h3>
        <p className="text-gray-500 text-center py-8">No class data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Class Analytics</h3>
        <button
          onClick={refetch}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {classData.map((classroom) => (
          <div key={classroom.classroom_id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{classroom.classroom_name}</h4>
                <p className="text-sm text-gray-600">{classroom.subject}</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-medium ${getScoreColor(classroom.average_score)}`}>
                  {formatPercentage(classroom.average_score)}
                </div>
                <div className="text-sm text-gray-500">{classroom.total_students} students</div>
              </div>
            </div>

            {/* Score Distribution */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Distribution</h5>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-medium text-green-700">{classroom.scores_distribution.excellent}</div>
                  <div className="text-green-600">Excellent</div>
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  <div className="font-medium text-blue-700">{classroom.scores_distribution.good}</div>
                  <div className="text-blue-600">Good</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded text-center">
                  <div className="font-medium text-yellow-700">{classroom.scores_distribution.satisfactory}</div>
                  <div className="text-yellow-600">Satisfactory</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-medium text-red-700">{classroom.scores_distribution.needs_improvement}</div>
                  <div className="text-red-600">Needs Work</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}