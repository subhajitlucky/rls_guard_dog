'use client'

import React from 'react'
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress'

interface RealtimeProgressFeedProps {
  schoolId?: string
  teacherId?: string
  studentId?: string
  classroomId?: string
  userRole: 'student' | 'teacher' | 'head_teacher'
}

export default function RealtimeProgressFeed({
  schoolId,
  teacherId,
  studentId,
  classroomId,
  userRole
}: RealtimeProgressFeedProps) {
  const { progressData, loading, error, connectionStatus, refresh } = useRealtimeProgress({
    schoolId,
    teacherId,
    studentId,
    classroomId
  })

  const formatScore = (score: number, maxScore: number) => {
    const percentage = Math.round((score / maxScore) * 100)
    return `${score}/${maxScore} (${percentage}%)`
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Progress</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-16"></div>
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
          <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
          <button
            onClick={refresh}
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

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          <button
            onClick={refresh}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {progressData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No progress data available</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {progressData.map((progress) => (
            <div key={progress.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">
                    {userRole === 'student' ? progress.classrooms?.name : progress.profiles?.full_name}
                  </h4>
                  {userRole !== 'student' && (
                    <span className="text-xs text-gray-500">
                      • {progress.classrooms?.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">{progress.subject}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(progress.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${getScoreColor(progress.score, progress.max_score)}`}>
                  {formatScore(progress.score, progress.max_score)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}